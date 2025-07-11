import { Controller } from "@flamework/core";
import ViewportModel from "@rbxts/viewport-model";

import { assets } from "shared/constants";
import { getItemByID, recordDiff } from "shared/utility";
import { INITIAL_DATA } from "shared/structs/player-data";

import type { ReplicaController } from "../replica";
import type { MainUIController } from "./main";

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
    print("additions:", additions);
    print("deletions:", deletions);
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
        // update count
        frame.Count.Text = tostring(currentCount - diff);
        continue;
      }

      this.frames.delete(id);
      frame.Destroy();
    }
  }

  private createItemFrame(itemID: number, count: number): ItemFrame {
    const itemTemplate = getItemByID(itemID);
    if (!itemTemplate)
      return warn("Failed to create inventory frame: no item found for ID", itemID)!;

    const item = itemTemplate.Clone();
    const frame = assets.UI.InventoryItem.Clone();
    const viewport = frame.Viewport;
    item.PivotTo(CFrame.identity);
    item.Parent = viewport;
    (ViewportModel as { GenerateViewport: Callback }).GenerateViewport(viewport, item); // DUM DUM HACK BC THIS MODULE IS TYPED INCORRECTLY

    frame.Count.Text = tostring(count);
    frame.Parent = this.itemContainer;
    this.frames.set(itemID, frame);

    return frame;
  }
}