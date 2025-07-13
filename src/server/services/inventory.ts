import { Service } from "@flamework/core";

import { Message, messaging } from "shared/messaging";
import { dropItem, stopHacking } from "server/utility";
import { getItemByID } from "shared/utility/items";
import { EXCLUSIVE_IDS } from "shared/item-id";
import type { PlayerData } from "shared/structs/player-data";

import type { DataService } from "./data";

@Service()
export class InventoryService {
  public constructor(
    private readonly data: DataService
  ) {
    messaging.server.on(Message.DropItem, (player, { id, position }) => this.dropItem(player, id, position));
    messaging.server.on(Message.AddHotbarItem, (player, { id, slot }) =>
      data.update(player, data => this.addHotbarItem(data, id, slot))
    );
    messaging.server.on(Message.RemoveHotbarItem, (player, slot) =>
      data.update(player, data => this.removeHotbarItem(data, slot))
    );
  }

  public async addItem(player: Player, id: number, count = 1): Promise<boolean> {
    id = tonumber(id)!;
    if (await this.has(player, id) && EXCLUSIVE_IDS.has(id))
      return false;

    return await this.data.update(player, data => {
      const itemCount = data.inventory.get(id);
      data.inventory.set(id, itemCount !== undefined ? itemCount + count : count);
      return true;
    });
  }

  public async removeItem(player: Player, id: number, count = 1, after?: (data: DeepWritable<PlayerData>) => boolean): Promise<boolean> {
    id = tonumber(id)!;
    if (!await this.has(player, id) || EXCLUSIVE_IDS.has(id))
      return false;

    return await this.data.update(player, data => {
      const itemCount = data.inventory.get(id)!;
      const newCount = itemCount - count;
      if (newCount <= 0)
        data.inventory.delete(id);
      else
        data.inventory.set(id, newCount);

      if (after) {
        const success = after(data);
        if (!success)
          return false;
      }

      return true;
    });
  }

  public async getItemCount(player: Player, id: number): Promise<number> {
    id = tonumber(id)!;
    const { inventory } = await this.data.get(player);
    return inventory.get(id) ?? 0;
  }

  public async has(player: Player, id: number): Promise<boolean> {
    const { inventory } = await this.data.get(player)
    return inventory.has(id);
  }

  private async dropItem(player: Player, id: number, position: Vector3): Promise<void> {
    const item = getItemByID(id);
    if (!item)
      return stopHacking(player, "invalid item ID (no corresponding item) when dropping item");
    if (EXCLUSIVE_IDS.has(id))
      return stopHacking(player, "the client checks for undroppable items before sending this message you dummy");

    await this.removeItem(player, id);
    dropItem(item, new CFrame(position));
  }

  private addHotbarItem(data: DeepWritable<PlayerData>, id: number, slot?: number): boolean {
    data.inventory.delete(id);
    if (slot === undefined)
      data.hotbar.push(id);
    else {
      const success = this.removeHotbarItem(data, slot);
      if (!success)
        return false;

      data.hotbar.insert(slot, id);
    }

    return true;
  }

  private removeHotbarItem(data: DeepWritable<PlayerData>, slot: number): boolean {
    const id = data.hotbar[slot];
    if (id === undefined)
      return false;

    data.hotbar[slot] = undefined!;
    data.inventory.set(id as number, 1);
    return true;
  }
}