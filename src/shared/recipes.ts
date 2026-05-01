import { getInstanceAtPath } from "@rbxts/flamework-meta-utils";
import { getDescendantsOfType } from "@rbxts/instance-utility";

import { RecipeKind, type CraftingRecipe } from "./structs/crafting-recipe";
import { StructureID } from "./structure-id";

// dumb new file bc this in constants.ts creates a recursive import
export const RECIPES = getDescendantsOfType(getInstanceAtPath("src/shared/crafting-recipes")!, "ModuleScript")
  .sort((a, b) => a.Name < b.Name)
  .map(require<CraftingRecipe>);

const structureRecipeCache = new Map<StructureID, CraftingRecipe>;
for (const recipe of RECIPES) {
  if (recipe.kind !== RecipeKind.Structure) continue;
  structureRecipeCache.set(recipe.yield, recipe);
}

export function getStructureRecipe(id: StructureID): Maybe<CraftingRecipe> {
  return structureRecipeCache.get(id);
}

export function getRecipeIndex(recipe: CraftingRecipe): number {
  return RECIPES.findIndex(r => r.kind === recipe.kind && r.yield === recipe.yield);
}