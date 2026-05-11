import { ItemRegistry } from "shared/registry/item-registry";
import type { CraftingRecipe } from "shared/structs/crafting-recipe";

interface DisplayNameOptions {
  readonly uppercase?: boolean;
}

export function getDisplayName(item: Instance, { uppercase = true }: DisplayNameOptions = {}): string {
  const name = item.GetAttribute<string>("DisplayName") ?? item.Name;
  return uppercase ? name.upper() : name;
}

export function isItemStackable(itemID: string): boolean;
export function isItemStackable(item: Model): boolean;
export function isItemStackable(item: Model | string): boolean {
  item = typeIs(item, "string") ? ItemRegistry.get(item) : item;
  return item.GetAttribute("ToolTier") === undefined;
}

export function getRecipeYieldID(recipe: CraftingRecipe): GameID {
  return typeIs(recipe.yield, "string") ? recipe.yield : recipe.yield[0];
}

export function getRecipeYieldCount(recipe: CraftingRecipe): number {
  return typeIs(recipe.yield, "string") ? 1 : recipe.yield[1];
}