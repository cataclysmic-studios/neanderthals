import { ItemID } from "shared/item-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  kind: RecipeKind.Tool,
  yield: ItemID.IronPickaxe,
  ingredients: [
    [ItemID.Stick, 1],
    [ItemID.IronBar, 3]
  ]
} satisfies CraftingRecipe;