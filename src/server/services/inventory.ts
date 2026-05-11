import { Service } from "@flamework/core";

import { Message, messaging } from "shared/messaging";
import { dropItem, stopHacking } from "server/utility";
import { inventoryHasSpace } from "shared/utility/data";
import { ItemRegistry } from "shared/registry/item-registry";
import { EXCLUSIVE_IDS } from "shared/item-id";
import type { PlayerData } from "shared/structs/player-data";

import type { DataService } from "./data";

const DROP_OFFSET = vector.create(0, 1.5, 0);

interface TransactionInfo {
  readonly add: [id: string, count: number][];
  readonly remove: [id: string, count: number][];
}

@Service()
export class InventoryService {
  public constructor(
    private readonly data: DataService
  ) {
    messaging.server.on(Message.DropItem, (player, id) => this.dropItem(player, id));
    messaging.server.on(Message.AddHotbarItem, (player, { id, slot }) =>
      data.update(player, data => this.addHotbarItem(data, id, slot))
    );
    messaging.server.on(Message.RemoveHotbarItem, (player, slot) =>
      data.update(player, data => this.removeHotbarItem(data, slot))
    );
  }

  public async get(player: Player): Promise<PlayerData["inventory"]> {
    const data = await this.data.get(player);
    return data.inventory;
  }

  public async getHotbar(player: Player): Promise<PlayerData["hotbar"]> {
    const data = await this.data.get(player);
    return data.hotbar;
  }

  public async transaction(player: Player, { add, remove }: TransactionInfo): Promise<boolean> {
    return await this.data.update(player, data => {
      const { inventory } = data;
      for (let [id, count] of add) {
        const itemCount = inventory[id];
        if (itemCount !== undefined && EXCLUSIVE_IDS.has(id)) continue;
        if (!inventoryHasSpace(data))
          return false;

        inventory[id] = itemCount !== undefined ? itemCount + count : count;
      }

      for (let [id, count] of remove) {
        const itemCount = inventory[id];
        if (itemCount === undefined || EXCLUSIVE_IDS.has(id)) continue;

        const newCount = itemCount - count;
        inventory[id] = newCount > 0 ? newCount : undefined;
      }

      return true;
    });
  }

  public async addItem(player: Player, id: string, count = 1): Promise<boolean> {
    const data = await this.data.get(player);
    if (id in data.inventory && EXCLUSIVE_IDS.has(id))
      return false;

    if (!inventoryHasSpace(data))
      return false;

    return await this.data.update(player, data => {
      const itemCount = data.inventory[id];
      data.inventory[id] = itemCount !== undefined ? itemCount + count : count;
      return true;
    });
  }

  public async removeItem(player: Player, id: string, count = 1, after?: (data: DeepWritable<PlayerData>) => boolean): Promise<boolean> {
    if (!await this.has(player, id) || EXCLUSIVE_IDS.has(id))
      return false;

    return await this.data.update(player, data => {
      const itemCount = data.inventory[id]!;
      const newCount = itemCount - count;
      data.inventory[id] = newCount > 0 ? newCount : undefined;

      if (after) {
        const success = after(data);
        if (!success)
          return false;
      }

      return true;
    });
  }

  public async getItemCount(player: Player, id: string): Promise<number> {
    const { inventory } = await this.data.get(player);
    return inventory[id] ?? 0;
  }

  public async has(player: Player, id: string, count?: number): Promise<boolean> {
    const { inventory } = await this.data.get(player);

    const hasItem = id in inventory;
    return count !== undefined
      ? hasItem && inventory[id]! >= count
      : hasItem;
  }

  private async dropItem(player: Player, id: string): Promise<void> {
    const item = ItemRegistry.get(id);
    if (!item)
      return stopHacking(player, "invalid item ID (no corresponding item) when dropping item");
    if (EXCLUSIVE_IDS.has(id))
      return stopHacking(player, "unable to drop exclusive item");

    const character = player.Character;
    if (!character) return;

    const characterPivot = character.GetPivot();
    const cframe = characterPivot
      .add(characterPivot.LookVector.mul(2))
      .add(DROP_OFFSET);

    await this.removeItem(player, id, 1, () => {
      dropItem(item, cframe);
      return true;
    });
  }

  private addHotbarItem(data: DeepWritable<PlayerData>, id: string, slot: HotbarKeyName): boolean {
    const { hotbar } = data;
    data.inventory[id] = undefined;

    if (slot in data.hotbar) {
      const success = this.removeHotbarItem(data, slot);
      if (!success) return true;
    }

    hotbar[slot] = id;
    return true;
  }

  private removeHotbarItem(data: DeepWritable<PlayerData>, slot: HotbarKeyName): boolean {
    const id = data.hotbar[slot];
    if (id === undefined)
      return false;

    data.hotbar[slot] = undefined;
    data.inventory[id] = 1;
    return true;
  }
}
