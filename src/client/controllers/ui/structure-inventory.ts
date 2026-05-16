import { Controller, type OnStart } from "@flamework/core";
import { applyDiff, createDiff } from "@rbxts/diff";

import { Message, messaging } from "shared/messaging";
import { mainScreen } from "client/constants";
import { IDRegistry } from "shared/registry/id-registry";

import { InventoryUIController } from "./inventory";
import type { InputController } from "../input";
import type { HoverInfoUIController } from "./hover-info";
import type { PlayerInventoryUIController } from "./player-inventory";
import type { HotbarUIController } from "./hotbar";

@Controller()
export class StructureInventoryController extends InventoryUIController implements OnStart {
  private readonly inventories = new Map<number, Map<number, number>>;
  private current?: number;

  public constructor(
    input: InputController,
    hoverInfo: HoverInfoUIController,
    private readonly inventoryUI: PlayerInventoryUIController,
    private readonly hotbar: HotbarUIController
  ) {
    super(mainScreen.StructureInventory, hoverInfo);

    input.onKeyDown(Enum.KeyCode.B, () => this.toggle(false));
    messaging.client.on(Message.UpdateStructureInventory, ({ structureID, diff }) => {
      const inventory = this.inventories.get(structureID) ?? new Map;
      const newInventory = applyDiff(inventory, diff);
      this.inventories.set(structureID, newInventory);
    });
  }

  public onStart(): void {

  }

  public setStructure(id: number): void {
    this.current = id;
    this.update(this.getInventory());
  }

  public toggle(on: boolean): void {
    this.hotbar.toggle(!on);
    this.inventoryUI.toggle(on);
    this.frame.Visible = on;
  }

  protected onItemClick(id: string): void {
    const structureID = this.current;
    if (!structureID) return;
    const idIndex = IDRegistry.getIndex(id);
    messaging.server.emit(Message.TakeFromStructureInventory, { structureID, itemID: idIndex });
  }

  protected onItemRightClick(id: string): void {
    // idk tbh, maybe drop from inventory?
  }

  private getInventory(): Map<number, number> {
    if (this.current === undefined)
      return new Map;

    return this.inventories.get(this.current) ?? new Map;
  }
}