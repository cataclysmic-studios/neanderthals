import { Item } from "shared/item-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  kind: RecipeKind.Tool,
  yield: Item.WoodPickaxe,
  ingredients: [
    [Item.Stick, 3],
    [Item.Log, 1]
  ]
} satisfies CraftingRecipe;