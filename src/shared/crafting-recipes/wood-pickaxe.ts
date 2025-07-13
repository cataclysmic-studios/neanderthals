import { Item } from "shared/item-id";
import type { CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  yield: Item.WoodPickaxe,
  ingredients: [
    [Item.Stick, 3],
    [Item.Log, 1]
  ]
} satisfies CraftingRecipe;