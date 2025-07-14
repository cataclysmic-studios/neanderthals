import { Item } from "shared/item-id";
import { Structure } from "shared/structure-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  kind: RecipeKind.Structure,
  yield: Structure.Campfire,
  ingredients: [
    [Item.Log, 2],
    [Item.Stick, 2]
  ]
} satisfies CraftingRecipe;