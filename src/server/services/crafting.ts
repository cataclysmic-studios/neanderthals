import { Service } from "@flamework/core";

import { Message, messaging } from "shared/messaging";
import { RECIPES } from "shared/recipes";
import type { CraftingRecipe } from "shared/structs/crafting-recipe";

import type { InventoryService } from "./inventory";

@Service()
export class CraftingService {
  public constructor(
    private readonly inventory: InventoryService
  ) {
    messaging.server.on(Message.Craft, (player, recipeIndex) => this.craft(player, RECIPES[recipeIndex]));
  }

  public async craft(player: Player, { yield: yieldItem, ingredients }: CraftingRecipe): Promise<boolean> {
    const { inventory } = this;
    const canCraft = ingredients.every(([id, count]) => inventory.has(player, id, count).await()[0]);
    if (!canCraft)
      return false;

    const yieldID = typeIs(yieldItem, "number") ? yieldItem : yieldItem[0];
    const yieldCount = typeIs(yieldItem, "number") ? 1 : yieldItem[1];
    return await inventory.transaction(player, {
      add: [[yieldID, yieldCount]],
      remove: ingredients
    });
  }
}