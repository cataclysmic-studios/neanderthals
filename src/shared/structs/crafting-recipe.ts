export const enum RecipeKind {
  Tool,
  Structure
}

interface BaseCraftingRecipe {
  readonly ingredients: [id: number, count: number][];
  readonly requiredLevel?: number;
}

export type CraftingRecipe = BaseCraftingRecipe & ({
  readonly kind: RecipeKind.Tool;
  readonly yield: number | [id: number, count: number];
} | {
  readonly kind: RecipeKind.Structure;
  readonly yield: number;
});