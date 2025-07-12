import { Service } from "@flamework/core";

import { EXCLUSIVE_IDS } from "shared/structs/item-id";

import type { DataService } from "./data";
import { Message, messaging } from "shared/messaging";
import { dropItem, getItemByID, stopHacking } from "shared/utility";

@Service()
export class InventoryService {
  public constructor(
    private readonly data: DataService
  ) {
    messaging.server.on(Message.DropItem, async (player, { id, position }) => {
      const item = getItemByID(id);
      if (!item)
        return stopHacking(player, "invalid item ID (no corresponding item) when dropping item");

      await this.removeItem(player, id);
      dropItem(item, new CFrame(position));
    });
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

  public async removeItem(player: Player, id: number, count = 1): Promise<boolean> {
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

      return true;
    });
  }

  public async has(player: Player, id: number): Promise<boolean> {
    const { inventory } = await this.data.get(player)
    return inventory.has(id);
  }
}