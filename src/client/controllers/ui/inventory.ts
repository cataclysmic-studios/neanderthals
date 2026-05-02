import { Controller } from "@flamework/core";
import { Trash } from "@rbxts/trash";
import Signal from "@rbxts/lemon-signal";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import { mainScreen } from "client/constants";
import { recordDiff } from "shared/utility";
import { isItemStackable } from "shared/utility/items";
import { addViewportItem } from "client/utility";
import { INITIAL_DATA } from "shared/structs/player-data";
import { EXCLUSIVE_IDS, type ItemID } from "shared/item-id";

import type { ReplicaController } from "../replica";
import type { CharacterController } from "../character";
import type { HotbarUIController } from "./hotbar";
import { ItemRegistry } from "shared/registry/item-registry";

interface ItemFrameInfo {
  readonly button: ItemButton;
  readonly trash: Trash;
}

const DROP_OFFSET = vector.create(0, 1.5, 0);

@Controller()
export class InventoryUIController {
  public readonly toggled = new Signal<(on: boolean) => void>;

  private readonly frame: PlayerGui["Main"]["Inventory"];
  private readonly itemContainer: ScrollingFrame;
  private readonly buttonInfos = new Map<string, ItemFrameInfo>;
  private lastInventory = INITIAL_DATA.inventory;

  public constructor(
    replica: ReplicaController,
    private readonly character: CharacterController,
    private readonly hotbar: HotbarUIController
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
      const deletions = new Set<string>;
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

  private update(changes: Record<string, Maybe<number>>, deletions: Set<string>): void {
    for (const [id, diff] of pairs(changes)) {
      const info = this.buttonInfos.get(id);
      if (info && isItemStackable(id)) {
        const currentCount = this.lastInventory.get(id) ?? 0;
        info.button.Count.Text = tostring(currentCount + (diff as number));
        continue;
      }

      this.createItemButton(id, diff as number);
    }

    for (const id of deletions) {
      if (!this.buttonInfos.has(id)) continue;
      this.deleteItemButton(id);
    }
  }

  private deleteItemButton(id: string): void {
    this.buttonInfos.get(id)?.trash.destroy();
    this.buttonInfos.delete(id);
  }

  private createItemButton(id: string, count: number): ItemButton {
    const itemTemplate = ItemRegistry.get(id);
    const trash = new Trash;
    const button = assets.UI.InventoryItem.Clone();
    trash.linkToInstance(button);
    addViewportItem(button.Viewport, id);

    const isFood = itemTemplate.GetAttribute<boolean>("Food") ?? false;
    const isTool = itemTemplate.GetAttribute("ToolTier") !== undefined;
    const canDrop = !EXCLUSIVE_IDS.has(id);
    button.Name = itemTemplate.Name;
    button.Count.Text = tostring(count);
    trash.add(button.MouseButton1Click.Connect(() => {
      if (isFood)
        messaging.server.emit(Message.Eat, id);
      else if (isTool)
        this.hotbar.addItem(id);
    }));
    trash.add(button.MouseButton2Click.Connect(() => {
      if (!canDrop) return;

      const characterPivot = this.character.getPivot();
      if (!characterPivot) return;

      const position = characterPivot.Position
        .add(characterPivot.LookVector.mul(2))
        .add(DROP_OFFSET);

      messaging.server.emit(Message.DropItem, { id, position });
    }));
    button.Parent = this.itemContainer;

    this.buttonInfos.set(id, { button, trash });
    return button;
  }
}