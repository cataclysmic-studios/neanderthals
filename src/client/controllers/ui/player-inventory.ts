import { Controller } from "@flamework/core";
import Signal from "@rbxts/lemon-signal";

import { Message, messaging } from "shared/messaging";
import { mainScreen } from "client/constants";
import { isToolItem } from "shared/utility/items";
import { IDRegistry } from "shared/registry/id-registry";
import { ItemRegistry } from "shared/registry/item-registry";
import { EXCLUSIVE_IDS } from "shared/item-id";

import { InventoryUIController } from "./inventory";
import type { ReplicaController } from "../replication/replica";
import type { InputController } from "../input";
import type { HoverInfoUIController } from "./hover-info";
import type { CraftingUIController } from "./crafting";
import type { HotbarUIController } from "./hotbar";

@Controller()
export class PlayerInventoryUIController extends InventoryUIController {
  public readonly toggled = new Signal<(on: boolean) => void>;

  public constructor(
    replica: ReplicaController,
    input: InputController,
    hoverInfo: HoverInfoUIController,
    private readonly craftingUI: CraftingUIController,
    private readonly hotbar: HotbarUIController
  ) {
    super(mainScreen.Inventory, hoverInfo);

    input.onKeyDown(Enum.KeyCode.B, () => this.toggle());
    replica.updated.Connect(data => this.update(data.inventory));
  }

  public toggle(on = !this.frame.Visible): void {
    if (this.frame.Visible === on) return;
    this.frame.Visible = on;
    this.craftingUI.toggle(on);
    this.toggled.Fire(on);
  }

  public isEnabled(): boolean {
    return this.frame.Visible;
  }

  protected onItemClick(id: string): void {
    const idIndex = IDRegistry.getIndex(id);
    const item = ItemRegistry.get(id);
    const isConsumable = item.GetAttribute<boolean>("Consumable") ?? false;
    const isTool = isToolItem(item);
    if (isConsumable)
      messaging.server.emit(Message.Consume, idIndex);
    else if (isTool)
      this.hotbar.addItem(id);
  }

  protected onItemRightClick(id: string): void {
    const idIndex = IDRegistry.getIndex(id);
    const canDrop = !EXCLUSIVE_IDS.has(id);
    if (!canDrop) return;
    messaging.server.emit(Message.DropItem, idIndex);
  }
}