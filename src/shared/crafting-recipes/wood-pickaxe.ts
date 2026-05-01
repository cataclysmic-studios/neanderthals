import { ItemID } from "shared/item-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  kind: RecipeKind.Tool,
  yield: ItemID.WoodPickaxe,
  ingredients: [
    [ItemID.Stick, 3],
    [ItemID.Log, 1]
  ]
} satisfies CraftingRecipe;