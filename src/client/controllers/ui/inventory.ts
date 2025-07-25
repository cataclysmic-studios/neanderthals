import { Controller } from "@flamework/core";
import { Trash } from "@rbxts/trash";
import Signal from "@rbxts/lemon-signal";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import { mainScreen } from "client/constants";
import { recordDiff } from "shared/utility";
import { getItemByID, isItemStackable } from "shared/utility/items";
import { addViewportItem } from "client/utility";
import { INITIAL_DATA } from "shared/structs/player-data";
import { EXCLUSIVE_IDS } from "shared/item-id";

import type { ReplicaController } from "../replica";
import type { CharacterController } from "../character";
import type { HotbarUIController } from "./hotbar";
import type { TribesUIController } from "./tribes";

interface ItemFrameInfo {
  readonly button: ItemButton;
  readonly trash: Trash;
}

@Controller()
export class InventoryUIController {
  public readonly toggled = new Signal<(on: boolean) => void>;

  private readonly frame: PlayerGui["Main"]["Inventory"];
  private readonly itemContainer: ScrollingFrame;
  private readonly buttonInfos = new Map<number, ItemFrameInfo>;
  private lastInventory = INITIAL_DATA.inventory;

  public constructor(
    replica: ReplicaController,
    private readonly character: CharacterController,
    private readonly hotbar: HotbarUIController,
    tribesUI: TribesUIController
  ) {
    const frame = this.frame = mainScreen.Inventory;
    this.itemContainer = frame.Content;

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
    this.toggled.Fire(on);
  }

  public isEnabled(): boolean {
    return this.frame.Visible;
  }

  private update(changes: Record<number, Maybe<number>>, deletions: Set<number>): void {
    for (const [id, diff] of pairs(changes)) {
      const info = this.buttonInfos.get(id);
      if (info && isItemStackable(id)) {
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
    const trash = new Trash;
    const button = assets.UI.InventoryItem.Clone();
    trash.linkToInstance(button);
    addViewportItem(button.Viewport, itemID);

    const isFood = itemTemplate.GetAttribute<boolean>("Food") ?? false;
    const isTool = itemTemplate.GetAttribute("ToolTier") !== undefined;
    const canDrop = !EXCLUSIVE_IDS.has(itemID);
    button.Name = itemTemplate.Name;
    button.Count.Text = tostring(count);
    trash.add(button.MouseButton1Click.Connect(() => {
      if (isFood)
        messaging.server.emit(Message.Eat, itemID);
      else if (isTool)
        this.hotbar.addItem(itemID);
    }));
    trash.add(button.MouseButton2Click.Connect(() => {
      if (!canDrop) return;

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