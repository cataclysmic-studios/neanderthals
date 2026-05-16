import { Controller } from "@flamework/core";
import { applyDiff } from "@rbxts/diff";

import { Message, messaging } from "shared/messaging";
import { mainScreen } from "client/constants";
import { StructureRegistry } from "shared/registry/structure-registry";
import { IDRegistry } from "shared/registry/id-registry";

import { InventoryUIController } from "./inventory";
import type { InputController } from "../input";
import type { HoverInfoUIController } from "./hover-info";
import type { MainUIController } from "./main";
import type { CraftingUIController } from "./crafting";
import type { PlayerInventoryUIController } from "./player-inventory";
import type { HotbarUIController } from "./hotbar";

@Controller()
export class StructureInventoryUIController extends InventoryUIController<"StructureInventory"> {
  private readonly inventories = new Map<number, Map<number, number>>;
  private current?: number;

  public constructor(
    input: InputController,
    hoverInfo: HoverInfoUIController,
    private readonly mainUI: MainUIController,
    private readonly craftingUI: CraftingUIController,
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

  public setStructure(placementID: number, id: string): void {
    this.current = placementID;
    this.frame.Title.Text = StructureRegistry.get(id).Name.upper();
    this.update(this.getInventory());
  }

  public toggle(on: boolean): void {
    if (this.frame.Visible === on) return;
    this.hotbar.toggle(!on);
    this.mainUI.toggle(!on);
    this.inventoryUI.toggle(on);
    this.craftingUI.toggle(!on);
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