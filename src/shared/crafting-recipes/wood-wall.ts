import { ItemID } from "shared/item-id";
import { StructureID } from "shared/structure-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  id: "neanderthals:wood_wall_recipe",
  kind: RecipeKind.Structure,
  yield: StructureID.WoodWall,
  ingredients: [
    [ItemID.Log, 4]
  ]
} satisfies CraftingRecipe;