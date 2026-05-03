import { ItemID } from "shared/item-id";
import { StructureID } from "shared/structure-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  kind: RecipeKind.Structure,
  yield: StructureID.WoodGate,
  ingredients: [
    [ItemID.Log, 4],
    [ItemID.Stick, 2]
  ]
} satisfies CraftingRecipe;