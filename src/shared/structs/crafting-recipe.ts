export interface CraftingRecipe {
  readonly yield: number | [id: number, count: number];
  readonly ingredients: [id: number, count: number][];
  readonly requiredLevel?: number;
}