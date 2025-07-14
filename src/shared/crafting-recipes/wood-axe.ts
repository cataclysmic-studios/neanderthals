import { Item } from "shared/item-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  kind: RecipeKind.Tool,
  yield: Item.WoodAxe,
  ingredients: [
    [Item.Stick, 2],
    [Item.Log, 1]
  ]
} satisfies CraftingRecipe;