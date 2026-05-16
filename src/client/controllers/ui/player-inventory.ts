import { Controller } from "@flamework/core";
import { Trash } from "@rbxts/trash";
import Signal from "@rbxts/lemon-signal";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import { mainScreen } from "client/constants";
import { recordDiff } from "shared/utility";
import { isItemStackable, isToolItem } from "shared/utility/items";
import { addViewportItem } from "client/utility";
import { getInitialData, type PlayerData } from "shared/structs/player-data";
import { IDRegistry } from "shared/registry/id-registry";
import { ItemRegistry } from "shared/registry/item-registry";
import { EXCLUSIVE_IDS } from "shared/item-id";

import type { ReplicaController } from "../replication/replica";
import type { InputController } from "../input";
import type { HotbarUIController } from "./hotbar";
import type { HoverInfoUIController } from "./hover-info";

interface ItemFrameInfo {
  readonly button: ItemButton;
  readonly trash: Trash;
}

@Controller()
export class PlayerInventoryUIController {
  public readonly toggled = new Signal<(on: boolean) => void>;

  private readonly frame: PlayerGui["Main"]["Inventory"];
  private readonly itemContainer: ScrollingFrame;
  private readonly buttonInfos = new Map<string, ItemFrameInfo>;
  private lastInventory?: PlayerData["inventory"];

  public constructor(
    replica: ReplicaController,
    input: InputController,
    private readonly hoverInfo: HoverInfoUIController,
    private readonly hotbar: HotbarUIController
  ) {
    const frame = this.frame = mainScreen.Inventory;
    this.itemContainer = frame.Content;

    input.onKeyDown(Enum.KeyCode.B, () => this.toggle());
    replica.updated.Connect(data => {
      const last = this.lastInventory ?? getInitialData().inventory;
      let changes = recordDiff(data.inventory as unknown as Map<number, number>, last);
      for (const [index, count] of pairs(changes)) {
        const lastCount = last.get(index) ?? 0;
        const countDiff = count - lastCount;
        changes[index] = countDiff;
      }

      const deletionsRecord = recordDiff(last as unknown as Map<number, number>, data.inventory, false);
      const deletions = new Set<number>;
      for (const [index] of pairs(deletionsRecord))
        deletions.add(index);

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
    task.spawn(() => {
      for (const index of deletions) {
        const id = IDRegistry.getID(index);
        if (!this.buttonInfos.has(id)) continue;
        this.deleteItemButton(id);
      }
    });
    for (const [index, diff] of pairs(changes)) {
      const id = IDRegistry.getID(index);
      const info = this.buttonInfos.get(id);
      if (!info || !isItemStackable(id)) {
        this.createItemButton(id, diff as number);
        continue;
      }

      const last = this.lastInventory ?? getInitialData().inventory;
      const currentCount = last.get(index) ?? 0;
      info.button.Count.Text = tostring(currentCount + (diff as number));
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

    const isConsumable = itemTemplate.GetAttribute<boolean>("Consumable") ?? false;
    const isTool = isToolItem(itemTemplate);
    const canDrop = !EXCLUSIVE_IDS.has(id);
    button.Name = itemTemplate.Name;
    button.Count.Text = tostring(count);

    const { hoverInfo } = this;
    const idIndex = IDRegistry.getIndex(id);
    trash.add(button.MouseButton1Click.Connect(() => {
      if (isConsumable)
        messaging.server.emit(Message.Consume, idIndex);
      else if (isTool)
        this.hotbar.addItem(id);
    }));
    trash.add(button.MouseButton2Click.Connect(() => {
      if (!canDrop) return;
      messaging.server.emit(Message.DropItem, idIndex);
    }));
    trash.add(button.MouseEnter.Connect((x, y) => {
      hoverInfo.updatePosition(x, y);
      hoverInfo.enable(itemTemplate);
    }));
    trash.add(button.MouseLeave.Connect(() => hoverInfo.disable()));
    trash.add(button.MouseMoved.Connect((x, y) => hoverInfo.updatePosition(x, y)));
    trash.add(() => {
      if (hoverInfo.getCurrent() !== itemTemplate) return;
      hoverInfo.disable();
    });
    button.Parent = this.itemContainer;

    this.buttonInfos.set(id, { button, trash });
    return button;
  }
}