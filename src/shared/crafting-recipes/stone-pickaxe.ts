import { Item } from "shared/item-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  kind: RecipeKind.Tool,
  yield: Item.StonePickaxe,
  ingredients: [
    [Item.Stick, 1],
    [Item.Stone, 3]
  ]
} satisfies CraftingRecipe;