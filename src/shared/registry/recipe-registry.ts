import { getDescendantsOfType } from "@rbxts/instance-utility";
import { getInstanceAtPath } from "@rbxts/flamework-meta-utils";

import { Registry } from "./registry";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

function recipeEquals(a: CraftingRecipe, b: CraftingRecipe): boolean {
  let match = true;
  if (typeIs(a.yield, "string")) {
    match &&= a.yield === b.yield;
  } else {
    assert(!typeIs(b.yield, "string"));
    match &&= a.yield[0] === b.yield[0];
    match &&= a.yield[1] === b.yield[1];
  }

  return a.kind === b.kind && match;
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
    this.allRecipes = recipes;
    this.structureRecipes.clear();
    this.itemRecipes.clear();
    for (const recipe of recipes)
      this.categorize(recipe);
  }

  public getAll(): readonly CraftingRecipe[] {
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

  public getYieldCount(id: string): number {
    const recipe = this.getStructure(id) ?? this.getItem(id);
    if (recipe.kind === RecipeKind.Structure || typeIs(recipe.yield, "string"))
      return 1;

    return recipe.yield[1];
  }

  public loadVanilla(): void {
    const recipes = getDescendantsOfType(getInstanceAtPath("src/shared/crafting-recipes")!, "ModuleScript")
      .sort((a, b) => a.Name < b.Name)
      .map(require<CraftingRecipe>);

    this.sync(recipes);
  }

  private categorize(recipe: CraftingRecipe): void {
    if (recipe.kind === RecipeKind.Structure) {
      this.structureRecipes.set(recipe.yield, recipe);
    } else {
      const id = typeIs(recipe.yield, "string") ? recipe.yield : recipe.yield[0];
      this.itemRecipes.set(id, recipe);
    }
  }
}

export const RecipeRegistry = new RecipeRegistryClass;
RecipeRegistry.loadVanilla();