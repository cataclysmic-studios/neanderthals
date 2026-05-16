import { ItemRegistry } from "shared/registry/item-registry";
import type { CraftingRecipe } from "shared/structs/crafting-recipe";

interface DisplayNameOptions {
  readonly uppercase?: boolean;
}

export function isToolItem(item: Model): item is ToolItem;
export function isToolItem(id: GameID): boolean;
export function isToolItem(id: GameID | Model): boolean {
  const item = typeIs(id, "string") ? ItemRegistry.get(id) : id;
  const attributes = item.GetAttributes();
  return "ToolTier" in attributes && "StructureDamage" in attributes && "EntityDamage" in attributes;
}

export function isVanillaID(id: string): boolean {
  return id.sub(1, 13) === "neanderthals:";
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