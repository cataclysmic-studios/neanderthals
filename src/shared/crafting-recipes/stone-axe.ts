import { Item } from "shared/item-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  kind: RecipeKind.Tool,
  yield: Item.StoneAxe,
  ingredients: [
    [Item.Stick, 1],
    [Item.Stone, 2]
  ]
} satisfies CraftingRecipe;