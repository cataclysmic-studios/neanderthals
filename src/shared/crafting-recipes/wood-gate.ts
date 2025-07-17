import { Item } from "shared/item-id";
import { Structure } from "shared/structure-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  kind: RecipeKind.Structure,
  yield: Structure.WoodGate,
  ingredients: [
    [Item.Log, 3],
    [Item.Stick, 1]
  ]
} satisfies CraftingRecipe;