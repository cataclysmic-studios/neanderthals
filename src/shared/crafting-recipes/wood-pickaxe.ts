import { ItemID } from "shared/item-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  id: "neanderthals:wood_pickaxe_recipe",
  kind: RecipeKind.Item,
  yield: ItemID.WoodPickaxe,
  ingredients: [
    [ItemID.Stick, 3],
    [ItemID.Log, 1]
  ]
} satisfies CraftingRecipe;