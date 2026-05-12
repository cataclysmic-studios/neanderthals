import { ItemID } from "shared/item-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  id: "neanderthals:club_recipe",
  kind: RecipeKind.Item,
  yield: ItemID.Club,
  ingredients: [
    [ItemID.Stick, 1],
    [ItemID.Log, 2]
  ]
} satisfies CraftingRecipe;