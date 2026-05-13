import { getInstanceAtPath } from "@rbxts/flamework-meta-utils";

import { Registry } from "./registry";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";
import { getRecipeYieldID, isVanillaID } from "shared/utility/items";

class RecipeRegistryClass extends Registry {
  private readonly structureRecipes = new Map<string, CraftingRecipe>;
  private readonly itemRecipes = new Map<string, CraftingRecipe>;
  private allRecipes = new Map<string, CraftingRecipe>;

  public register(recipe: CraftingRecipe): void {
    this.allRecipes.set(recipe.id, recipe);
    this.categorize(recipe);
  }

  public sync(recipes: CraftingRecipe[]): void {
    for (const recipe of recipes) {
      this.register(recipe);
    }
  }

  public getAll(): CraftingRecipe[] {
    return [...this.allRecipes].map(([_, recipe]) => recipe);
  }

  public getAllIDs(): GameID[] {
    return [...this.allRecipes].map(([_, recipe]) => recipe.id);
  }

  public getModded(): CraftingRecipe[] {
    return this.getAll().filter(recipe => !isVanillaID(recipe.id));
  }

  /** **Note:** `id` here is a recipe ID, not an item/structure ID */
  public get(id: string): Maybe<CraftingRecipe> {
    return this.allRecipes.get(id);
  }

  /** **Note:** `id` here is a structure ID, not recipe ID */
  public getStructure(id: string): Maybe<CraftingRecipe> {
    return this.structureRecipes.get(id);
  }

  /** **Note:** `id` here is an item ID, not recipe ID */
  public getItem(id: string): CraftingRecipe {
    return this.itemRecipes.get(id)!;
  }

  public load(): void {
    const recipes = getInstanceAtPath("src/shared/crafting-recipes")!
      .QueryDescendants<ModuleScript>("ModuleScript")
      .sort((a, b) => a.Name < b.Name)
      .map(require<CraftingRecipe>);

    this.sync(recipes);
  }

  private categorize(recipe: CraftingRecipe): void {
    if (recipe.kind === RecipeKind.Structure) {
      this.structureRecipes.set(recipe.yield, recipe);
    } else {
      const id = getRecipeYieldID(recipe);
      this.itemRecipes.set(id, recipe);
    }
  }
}

export const RecipeRegistry = new RecipeRegistryClass;