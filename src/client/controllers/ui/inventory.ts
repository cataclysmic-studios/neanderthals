import { Controller } from "@flamework/core";
import { Trash } from "@rbxts/trash";
import ViewportModel from "@rbxts/viewport-model";

import { assets } from "shared/constants";
import { dropItem, getItemByID, recordDiff } from "shared/utility";
import { INITIAL_DATA } from "shared/structs/player-data";

import type { ReplicaController } from "../replica";
import type { CharacterController } from "../character";
import type { MainUIController } from "./main";
import { Message, messaging } from "shared/messaging";

const { rad } = math;
const { identity, Angles: angles } = CFrame;

const VIEWPORT_CAMERA_CFRAME = angles(rad(-30), 0, 0).add(vector.create(0.1, 2.4, 4.75));
const ITEM_ROTATION = angles(0, rad(45), rad(45));

interface ItemFrameInfo {
  readonly button: ItemButton;
  readonly trash: Trash;
}

@Controller()
export class InventoryUIController {
  private readonly frame: PlayerGui["Main"]["Inventory"];
  private readonly itemContainer: ScrollingFrame;
  private readonly buttonInfos = new Map<number, ItemFrameInfo>;
  private lastInventory = INITIAL_DATA.inventory;

  public constructor(
    replica: ReplicaController,
    private readonly character: CharacterController,
    private readonly mainUI: MainUIController
  ) {
    const frame = this.frame = mainUI.screen.Inventory;
    this.itemContainer = frame.Content;

    mainUI.enabled.Connect(() => this.toggle(false));
    replica.updated.Connect(data => {
      const last = this.lastInventory;
      let changes = recordDiff(data.inventory, last);
      for (const [id, count] of pairs(changes)) {
        const lastCount = last.get(id) ?? 0;
        const countDiff = count - lastCount;
        changes[id] = countDiff;
      }

      const deletionsRecord = recordDiff(last, data.inventory, false);
      const deletions = new Set<number>;
      for (const [id] of pairs(deletionsRecord))
        deletions.add(id);

      this.update(changes, deletions);
      this.lastInventory = data.inventory;
    });
  }

  public toggle(on = !this.frame.Visible): void {
    if (this.frame.Visible === on) return;
    this.frame.Visible = on;
    this.mainUI.toggle(!on);
  }

  private update(changes: Record<number, number>, deletions: Set<number>): void {
    for (const [id, diff] of pairs(changes)) {
      const info = this.buttonInfos.get(id);
      if (info) {
        const currentCount = this.lastInventory.get(id) ?? 0;
        info.button.Count.Text = tostring(currentCount + diff);
        continue;
      }

      this.createItemButton(id, diff);
    }

    for (const id of deletions) {
      if (!this.buttonInfos.has(id)) continue;
      this.deleteItemButton(id);
    }
  }

  private deleteItemButton(id: number): void {
    this.buttonInfos.get(id)?.trash.destroy();
    this.buttonInfos.delete(id);
  }

  private createItemButton(itemID: number, count: number): ItemButton {
    const itemTemplate = getItemByID(itemID);
    if (!itemTemplate)
      return warn("Failed to create inventory item frame: no item found with ID", itemID)!;

    const trash = new Trash;
    const item = itemTemplate.Clone();
    const button = assets.UI.InventoryItem.Clone();
    trash.linkToInstance(button);

    const viewport = button.Viewport;
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

    button.Name = item.Name;
    button.Count.Text = tostring(count);
    trash.add(button.MouseButton2Click.Connect(() => {
      const characterPivot = this.character.getPivot();
      if (!characterPivot) return;

      messaging.server.emit(Message.DropItem, {
        id: itemID,
        position: characterPivot.Position
          .add(characterPivot.LookVector.mul(2))
          .add(vector.create(0, 1.5, 0))
      });
    }));
    button.Parent = this.itemContainer;

    this.buttonInfos.set(itemID, { button, trash });
    return button;
  }
}