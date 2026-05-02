import { Service } from "@flamework/core";

import { Message, messaging } from "shared/messaging";
import { stopHacking } from "server/utility";
import { RecipeRegistry } from "shared/registry/recipe-registry";
import type { CraftingRecipe } from "shared/structs/crafting-recipe";

import type { InventoryService } from "./inventory";

@Service()
export class CraftingService {
  public constructor(
    private readonly inventory: InventoryService
  ) {
    messaging.server.on(Message.Craft, (player, recipeIndex) => {
      const recipe = RecipeRegistry.get(recipeIndex);
      if (!recipe)
        return stopHacking(player, "recipe index does not exist");

      this.craft(player, recipe);
    });
  }

  public async craft(player: Player, { yield: yieldItem, ingredients }: CraftingRecipe): Promise<boolean> {
    const { inventory } = this;
    const canCraft = ingredients.every(([id, count]) => inventory.has(player, id, count).await()[0]);
    if (!canCraft)
      return false;

    const yieldID = typeIs(yieldItem, "string") ? yieldItem : yieldItem[0];
    const yieldCount = typeIs(yieldItem, "string") ? 1 : yieldItem[1];
    return await inventory.transaction(player, {
      add: [[yieldID, yieldCount]],
      remove: ingredients
    });
  }
}