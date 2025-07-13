import { Service } from "@flamework/core";

import type { CraftingRecipe } from "shared/structs/crafting-recipe";

import type { InventoryService } from "./inventory";

@Service()
export class CraftingService {
  public constructor(
    private readonly inventory: InventoryService
  ) { }

  public async craft(player: Player, { yield: yieldItem, ingredients }: CraftingRecipe): Promise<boolean> {
    const { inventory } = this;
    const canCraft = ingredients.every(([id, count]) => inventory.has(player, id, count).await()[0]);
    if (canCraft)
      return false;

    const yieldID = typeIs(yieldItem, "number") ? yieldItem : yieldItem[0];
    const yieldCount = typeIs(yieldItem, "number") ? 1 : yieldItem[1];
    let success = inventory.addItem(player, yieldID, yieldCount);
    for (const [id, count] of ingredients)
      success &&= inventory.removeItem(player, id, count);

    return success;
  }
}