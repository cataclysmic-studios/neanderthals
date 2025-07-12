import { Item } from "shared/structs/item-id";
import type { CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  yield: Item.WoodAxe,
  ingredients: [
    [Item.Stick, 3],
    [Item.Log, 1]
  ]
} satisfies CraftingRecipe;