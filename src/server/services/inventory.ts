import { Service } from "@flamework/core";

import { EXCLUSIVE_IDS } from "shared/structs/item-id";

import type { DataService } from "./data";

@Service()
export class InventoryService {
  public constructor(
    private readonly data: DataService
  ) { }

  public async addItem(player: Player, id: number): Promise<boolean> {
    id = tonumber(id)!;
    const { inventory } = await this.data.get(player);
    if (inventory.has(id) && EXCLUSIVE_IDS.has(id))
      return false;

    return await this.data.update(player, data => {
      const itemCount = data.inventory.get(id);
      data.inventory.set(id, itemCount !== undefined ? itemCount + 1 : 1);
      return true;
    });
  }
}