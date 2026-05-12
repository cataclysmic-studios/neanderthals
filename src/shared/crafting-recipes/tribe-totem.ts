import { StructureID } from "shared/structure-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

export = {
  id: "neanderthals:tribe_totem_recipe",
  kind: RecipeKind.Structure,
  yield: StructureID.TribeTotem,
  ingredients: []
} satisfies CraftingRecipe;