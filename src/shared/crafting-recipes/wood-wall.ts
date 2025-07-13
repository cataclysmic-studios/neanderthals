import { Item } from "shared/item-id";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";
import { Structure } from "shared/structure-id";

export = {
  kind: RecipeKind.Structure,
  yield: Structure.WoodWall,
  ingredients: [
    [Item.Log, 3]
  ]
} satisfies CraftingRecipe;