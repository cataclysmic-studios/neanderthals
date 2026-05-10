import { ItemID } from "shared/item-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  kind: RecipeKind.Item,
  yield: ItemID.IronAxe,
  ingredients: [
    [ItemID.Stick, 1],
    [ItemID.IronBar, 2]
  ]
} satisfies CraftingRecipe;