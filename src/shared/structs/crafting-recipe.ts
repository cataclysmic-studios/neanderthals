import type { u8 } from "@rbxts/serio";
import { SerializedGameID } from "./packets";

export const enum RecipeKind {
  Item = "item",
  Structure = "structure"
}

interface BaseCraftingRecipe {
  readonly id: SerializedGameID;
  readonly ingredients: [id: SerializedGameID, count: u8][];
  readonly requiredLevel?: u8;
}

export type CraftingRecipe = BaseCraftingRecipe & ({
  readonly kind: RecipeKind.Item;
  readonly yield: SerializedGameID | [id: SerializedGameID, count: u8];
} | {
  readonly kind: RecipeKind.Structure;
  readonly yield: SerializedGameID;
});