import { Item } from "shared/item-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  kind: RecipeKind.Tool,
  yield: Item.IronAxe,
  ingredients: [
    [Item.Stick, 1],
    [Item.IronBar, 2]
  ]
} satisfies CraftingRecipe;