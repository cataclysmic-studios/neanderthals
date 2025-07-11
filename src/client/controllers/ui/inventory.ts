import { Controller } from "@flamework/core";
import ViewportModel from "@rbxts/viewport-model";

import { assets } from "shared/constants";
import { getItemByID, recordDiff } from "shared/utility";
import { INITIAL_DATA } from "shared/structs/player-data";

import type { ReplicaController } from "../replica";
import type { MainUIController } from "./main";

const { rad } = math;
const { identity, Angles: angles } = CFrame;

const VIEWPORT_CAMERA_CFRAME = angles(rad(-30), 0, 0).add(vector.create(0.1, 2.4, 4.75));
const ITEM_ROTATION = angles(0, rad(45), rad(45));

@Controller()
export class InventoryUIController {
  private readonly frame: PlayerGui["Main"]["Inventory"];
  private readonly itemContainer: ScrollingFrame;
  private readonly frames = new Map<number, ItemFrame>;
  private lastInventory = INITIAL_DATA.inventory;

  public constructor(
    replica: ReplicaController,
    private readonly mainUI: MainUIController
  ) {
    const frame = this.frame = mainUI.screen.Inventory;
    this.itemContainer = frame.Content;

    mainUI.enabled.Connect(() => this.toggle(false));
    replica.updated.Connect(data => {
      let additions = recordDiff(data.inventory, this.lastInventory);
      for (const [id, count] of pairs(additions)) {
        const lastCount = this.lastInventory.get(id) ?? 0;
        const countDiff = count - lastCount;
        additions[id] = countDiff > 0 ? countDiff : undefined!;
      }

      let deletions = recordDiff(this.lastInventory, data.inventory);
      for (const [id, count] of pairs(deletions)) {
        const lastCount = this.lastInventory.get(id) ?? 0;
        const countDiff = lastCount - count;
        deletions[id] = countDiff > 0 ? countDiff : undefined!;
      }

      this.update(additions, deletions);
      this.lastInventory = data.inventory;
    });
  }

  public toggle(on = !this.frame.Visible): void {
    if (this.frame.Visible === on) return;
    this.frame.Visible = on;
    this.mainUI.toggle(!on);
  }

  private update(additions: Record<number, number>, deletions: Record<number, number>): void {
    for (const [id, diff] of pairs(additions)) {
      const frame = this.frames.get(id);
      if (frame) {
        const currentCount = this.lastInventory.get(id) ?? 0;
        frame.Count.Text = tostring(currentCount + diff);
        continue;
      }

      this.createItemFrame(id, diff);
    }

    for (const [id, diff] of pairs(deletions)) {
      if (!this.frames.has(id)) continue;

      const frame = this.frames.get(id)!;
      const currentCount = this.lastInventory.get(id) ?? 0;
      if (currentCount - diff > 0) {
        frame.Count.Text = tostring(currentCount - diff);
        continue;
      }

      this.deleteItemFrame(id);
    }
  }

  private deleteItemFrame(id: number): void {
    this.frames.get(id)?.Destroy();
    this.frames.delete(id);
  }

  private createItemFrame(itemID: number, count: number): ItemFrame {
    const itemTemplate = getItemByID(itemID);
    if (!itemTemplate)
      return warn("Failed to create inventory item frame: no item found with ID", itemID)!;

    const item = itemTemplate.Clone();
    const frame = assets.UI.InventoryItem.Clone();
    const viewport = frame.Viewport;
    const camera = new Instance("Camera");
    camera.Focus = identity;
    camera.CFrame = VIEWPORT_CAMERA_CFRAME;
    camera.FieldOfView = 62;
    camera.Parent = viewport;
    viewport.CurrentCamera = camera;

    item.PivotTo(ITEM_ROTATION);
    item.Parent = viewport;

    const viewportModel = new ViewportModel(viewport, camera);
    viewportModel.SetModel(item);
    viewportModel.Calibrate();

    frame.Count.Text = tostring(count);
    frame.Parent = this.itemContainer;
    this.frames.set(itemID, frame);

    return frame;
  }
}