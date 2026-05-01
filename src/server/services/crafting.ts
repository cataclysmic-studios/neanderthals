import { Service } from "@flamework/core";

import { Message, messaging } from "shared/messaging";
import { RECIPES } from "shared/recipes";
import type { ItemID } from "shared/item-id";
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

    const yieldID = typeIs(yieldItem, "string") ? yieldItem as ItemID : yieldItem[0];
    const yieldCount = typeIs(yieldItem, "string") ? 1 : yieldItem[1];
    return await inventory.transaction(player, {
      add: [[yieldID, yieldCount]],
      remove: ingredients
    });
  }
}