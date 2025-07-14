import { Item } from "shared/item-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  kind: RecipeKind.Tool,
  yield: Item.IronPickaxe,
  ingredients: [
    [Item.Stick, 1],
    [Item.IronBar, 3]
  ]
} satisfies CraftingRecipe;