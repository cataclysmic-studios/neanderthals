import { ItemID } from "shared/item-id";
import { IRON_REQUIRED_LEVEL } from "shared/constants";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  id: "neanderthals:mace_recipe",
  kind: RecipeKind.Item,
  yield: ItemID.Mace,
  requiredLevel: IRON_REQUIRED_LEVEL,
  ingredients: [
    [ItemID.Stick, 1],
    [ItemID.IronBar, 2]
  ]
} satisfies CraftingRecipe;