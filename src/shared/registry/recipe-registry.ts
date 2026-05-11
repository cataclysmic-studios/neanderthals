import { getInstanceAtPath } from "@rbxts/flamework-meta-utils";

import { Registry } from "./registry";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";
import { getRecipeYieldCount, getRecipeYieldID } from "shared/utility/items";

function recipeEquals(a: CraftingRecipe, b: CraftingRecipe): boolean {
  return a.kind === b.kind
    && getRecipeYieldID(a) === getRecipeYieldID(b)
    && getRecipeYieldCount(a) === getRecipeYieldCount(b);
}

class RecipeRegistryClass extends Registry {
  private readonly structureRecipes = new Map<string, CraftingRecipe>;
  private readonly itemRecipes = new Map<string, CraftingRecipe>;
  private allRecipes: CraftingRecipe[] = [];

  public register(recipe: CraftingRecipe): void {
    this.allRecipes.push(recipe);
    this.categorize(recipe);
  }

  public sync(recipes: CraftingRecipe[]): void {
    this.sort(recipes);
    this.structureRecipes.clear();
    this.itemRecipes.clear();
    for (const recipe of recipes)
      this.categorize(recipe);
  }

  public sort(recipes: CraftingRecipe[] = this.allRecipes): void {
    this.allRecipes = recipes.sort((a, b) => {
      const aLevel = a.requiredLevel ?? 0;
      const bLevel = b.requiredLevel ?? 0;
      if (aLevel !== bLevel) {
        return aLevel < bLevel;
      }

      const aID = typeIs(a.yield, "string") ? a.yield : a.yield[0];
      const bID = typeIs(b.yield, "string") ? b.yield : b.yield[0];
      return aID < bID;
    });
  }

  public getAll(): CraftingRecipe[] {
    return this.allRecipes;
  }

  public get(index: number): Maybe<CraftingRecipe> {
    return this.allRecipes[index];
  }

  public getStructure(id: string): Maybe<CraftingRecipe> {
    return this.structureRecipes.get(id);
  }

  public getItem(id: string): CraftingRecipe {
    return this.itemRecipes.get(id)!;
  }

  // TODO: replace with recipe IDs
  public getIndex(recipe: CraftingRecipe): number {
    return this.allRecipes.findIndex(r => recipeEquals(r, recipe));
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
RecipeRegistry.load();