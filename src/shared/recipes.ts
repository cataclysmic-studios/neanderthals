import { getInstanceAtPath } from "@rbxts/flamework-meta-utils";
import { getDescendantsOfType } from "@rbxts/instance-utility";
import type { CraftingRecipe } from "./structs/crafting-recipe";

// dumb new file bc this in constants.ts creates a recursive import
export const RECIPES = getDescendantsOfType(getInstanceAtPath("src/shared/crafting-recipes")!, "ModuleScript")
  .map(require<CraftingRecipe>);