import type { ItemID } from "shared/item-id";
import type { StructureID } from "shared/structure-id";

export const enum RecipeKind {
  Tool,
  Structure
}

interface BaseCraftingRecipe {
  readonly ingredients: [id: ItemID, count: number][];
  readonly requiredLevel?: number;
}

export type CraftingRecipe = BaseCraftingRecipe & ({
  readonly kind: RecipeKind.Tool;
  readonly yield: ItemID | [id: ItemID, count: number];
} | {
  readonly kind: RecipeKind.Structure;
  readonly yield: StructureID;
});