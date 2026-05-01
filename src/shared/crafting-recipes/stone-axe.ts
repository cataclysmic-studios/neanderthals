import { ItemID } from "shared/item-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  kind: RecipeKind.Tool,
  yield: ItemID.StoneAxe,
  ingredients: [
    [ItemID.Stick, 1],
    [ItemID.Stone, 2]
  ]
} satisfies CraftingRecipe;