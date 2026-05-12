import { ItemID } from "shared/item-id";
import { StructureID } from "shared/structure-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  id: "neanderthals:campfire_recipe",
  kind: RecipeKind.Structure,
  yield: StructureID.Campfire,
  ingredients: [
    [ItemID.Log, 2],
    [ItemID.Stick, 2]
  ]
} satisfies CraftingRecipe;