import { ItemID } from "shared/item-id";
import { StructureID } from "shared/structure-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  id: "neanderthals:raft_recipe",
  kind: RecipeKind.Structure,
  yield: StructureID.Raft,
  ingredients: [
    [ItemID.Log, 1],
    [ItemID.Stick, 4]
  ]
} satisfies CraftingRecipe;