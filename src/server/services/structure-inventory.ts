import { OnStart, Service } from "@flamework/core";
import { createDiff } from "@rbxts/diff";

import { Message, messaging } from "shared/messaging";
import { IDRegistry } from "shared/registry/id-registry";
import type { TakeFromStructureInventoryPacket } from "shared/structs/packets";

import type { InventoryService } from "./inventory";

interface ItemInventoryInfo {
  locked: boolean;
  readonly items: Map<number, number>;
};

@Service()
export class StructureInventoryService implements OnStart {
  private readonly inventories = new Map<number, ItemInventoryInfo>;

  public constructor(
    private readonly inventory: InventoryService
  ) { }

  public onStart(): void {
    messaging.server.on(Message.TakeFromStructureInventory, (player, { structureID, itemID }) =>
      this.take(player, { structureID, itemID })
    );
  }

  public create(structureID: number): void {
    this.inventories.set(structureID, { locked: false, items: new Map });
  }

  public delete(structureID: number): void {
    this.inventories.delete(structureID);
  }

  public toggleLock(structureID: number, on: boolean): void {
    const inventory = this.inventories.get(structureID);
    if (!inventory) return;
    inventory.locked = on;
  }

  public updateItems(structureID: number, transform: (inventory: Map<number, number>) => boolean): void {
    const inventory = this.inventories.get(structureID);
    if (!inventory) return;

    const { locked, items } = inventory;
    const transformed = table.clone(items);
    const commit = transform(transformed);
    if (!commit) return;

    this.inventories.set(structureID, { locked, items: transformed });
    const diff = createDiff(items, transformed);
    messaging.client.emitAll(Message.UpdateStructureInventory, { structureID, diff });
  }

  private async take(player: Player, { structureID, itemID }: TakeFromStructureInventoryPacket): Promise<void> {
    const inventory = this.inventories.get(structureID);
    if (!inventory) return;
    if (inventory.locked) return;

    const count = inventory.items.get(itemID) ?? 0;
    this.updateItems(structureID, inventory => {
      if (!inventory.has(itemID))
        return false;

      inventory.set(itemID, 0);
      return true;
    });

    const id = IDRegistry.getID(itemID);
    await this.inventory.addItem(player, id, count);
  }
}