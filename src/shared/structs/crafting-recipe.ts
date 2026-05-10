import type { u8 } from "@rbxts/serio";

import type { GameID } from "./packets";

export const enum RecipeKind {
  Item = "item",
  Structure = "structure"
}

interface BaseCraftingRecipe {
  readonly ingredients: [id: GameID, count: u8][];
  readonly requiredLevel?: u8;
}

export type CraftingRecipe = BaseCraftingRecipe & ({
  readonly kind: RecipeKind.Item;
  readonly yield: GameID | [id: GameID, count: u8];
} | {
  readonly kind: RecipeKind.Structure;
  readonly yield: GameID;
});