import { ItemID } from "shared/item-id";
import { StructureID } from "shared/structure-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  id: "neanderthals:crate_recipe",
  kind: RecipeKind.Structure,
  yield: StructureID.Crate,
  ingredients: [
    [ItemID.Log, 1],
    [ItemID.Stick, 3]
  ]
} satisfies CraftingRecipe;