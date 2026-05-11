import { Service } from "@flamework/core";

import { Message, messaging } from "shared/messaging";
import { stopHacking } from "server/utility";
import { RecipeRegistry } from "shared/registry/recipe-registry";
import type { CraftingRecipe } from "shared/structs/crafting-recipe";

import type { InventoryService } from "./inventory";
import { getRecipeYieldCount, getRecipeYieldID } from "shared/utility/items";

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

  public async craft(player: Player, recipe: CraftingRecipe): Promise<boolean> {
    const { inventory } = this;
    const canCraft = recipe.ingredients.every(([id, count]) => inventory.has(player, id, count).await()[1] as boolean);
    if (!canCraft)
      return false;

    const yieldID = getRecipeYieldID(recipe);
    const yieldCount = getRecipeYieldCount(recipe);
    return await inventory.transaction(player, {
      add: [[yieldID, yieldCount]],
      remove: recipe.ingredients
    });
  }
}