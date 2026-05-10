import { ItemID } from "shared/item-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  kind: RecipeKind.Item,
  yield: ItemID.StonePickaxe,
  ingredients: [
    [ItemID.Stick, 1],
    [ItemID.Stone, 3]
  ]
} satisfies CraftingRecipe;