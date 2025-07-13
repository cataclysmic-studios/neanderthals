import { Controller } from "@flamework/core";
import { getInstanceAtPath } from "@rbxts/flamework-meta-utils";
import { getDescendantsOfType } from "@rbxts/instance-utility";

import { assets } from "shared/constants";
import { mainScreen } from "client/constants";
import { getItemByID, getItemDisplayName } from "shared/utility/items";
import { addViewportItem } from "client/utility";
import type { CraftingRecipe } from "shared/structs/crafting-recipe";

const RECIPES = getDescendantsOfType(getInstanceAtPath("src/shared/crafting-recipes")!, "ModuleScript").map(require<CraftingRecipe>);

@Controller()
export class CraftingUIController {
  private readonly frame = mainScreen.Crafting;
  private readonly storage = this.frame.Content;

  public constructor() {
    for (const recipe of RECIPES) {
      const { yield: yieldItem, ingredients, requiredLevel } = recipe;
      // TODO: required level UI
      const yieldID = typeIs(yieldItem, "number") ? yieldItem : yieldItem[0];
      this.createRecipeFrame(yieldID, ingredients);
    }
  }

  private createRecipeFrame(yieldID: number, ingredients: CraftingRecipe["ingredients"]): void {
    const item = getItemByID(yieldID);
    if (!item) return;

    const frame = assets.UI.CraftingRecipeFrame.Clone();
    for (const ingredient of ingredients)
      this.createIngredientFrame(frame.Ingredients, ingredient);

    addViewportItem(frame.Viewport, item);
    frame.Title.Text = getItemDisplayName(item);
    frame.Craft.MouseButton1Click.Connect(() => {
      print("attempt craft", getItemDisplayName(item));
    });
    frame.Parent = this.storage;
  }

  private createIngredientFrame(parent: Frame, [id, count]: [number, number]): void {
    const item = getItemByID(id);
    if (!item) return;

    const frame = assets.UI.IngredientFrame.Clone();
    frame.Title.Text = count + " " + item.Name;
    addViewportItem(frame.Viewport, id);

    frame.Parent = parent;
  }
}