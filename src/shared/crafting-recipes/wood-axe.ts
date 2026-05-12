import { ItemID } from "shared/item-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  id: "neanderthals:wood_axe_recipe",
  kind: RecipeKind.Item,
  yield: ItemID.WoodAxe,
  ingredients: [
    [ItemID.Stick, 2],
    [ItemID.Log, 1]
  ]
} satisfies CraftingRecipe;