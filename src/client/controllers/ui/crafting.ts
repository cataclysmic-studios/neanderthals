import { Controller } from "@flamework/core";
import { getChildrenOfType } from "@rbxts/instance-utility";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import { mainScreen } from "client/constants";
import { RECIPES } from "shared/recipes";
import { getItemByID, getDisplayName, getStructureByID } from "shared/utility/items";
import { addViewportItem } from "client/utility";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

import type { ReplicaController } from "../replica";

const DEFAULT_TEXT_COLOR = new Color3(1, 1, 1);
const NOT_ENOUGH_TEXT_COLOR = new Color3(0.7, 0, 0);
const DEFAULT_CRAFT_BUTTON_COLOR = assets.UI.CraftingRecipeFrame.Craft.BackgroundColor3;
const GRAYED_CRAFT_BUTTON_COLOR = new Color3(0.3, 0.3, 0.3);

@Controller()
export class CraftingUIController {
  private readonly frame = mainScreen.Crafting;
  private readonly storage = this.frame.Content;
  private readonly frames = new Map<CraftingRecipe, RecipeFrame>;

  public constructor(
    private readonly replica: ReplicaController
  ) {
    replica.updated.Connect(() => {
      for (const [{ ingredients }, frame] of this.frames) {
        const color = this.getCraftButtonColor(ingredients);
        frame.Craft.BackgroundColor3 = color;

        const ingredientFrames = getChildrenOfType<"Frame", IngredientFrame>(frame.Ingredients, "Frame");
        let i = 0;
        for (const ingredientFrame of ingredientFrames) {
          const [id, count] = ingredients[i++];
          ingredientFrame.Title.TextColor3 = this.getTextColor(id, count);
        }
      }
    });

    for (const recipe of RECIPES) {
      const frame = this.createRecipeFrame(recipe);
      if (!frame) continue;

      this.frames.set(recipe, frame);
    }
  }

  private createRecipeFrame(recipe: CraftingRecipe): Maybe<RecipeFrame> {
    const { kind, yield: yieldItem, ingredients, requiredLevel } = recipe;
    const yieldID = typeIs(yieldItem, "number") ? yieldItem : yieldItem[0];
    const item = recipe.kind === RecipeKind.Structure
      ? getStructureByID(yieldID)
      : getItemByID(yieldID);

    if (!item) return;

    // TODO: required level UI
    const frame = assets.UI.CraftingRecipeFrame.Clone();
    for (const ingredient of ingredients)
      this.createIngredientFrame(frame.Ingredients, ingredient);

    addViewportItem(frame.Viewport, item);
    frame.Title.Text = getDisplayName(item);

    const color = this.getCraftButtonColor(ingredients);
    frame.Craft.BackgroundColor3 = color;
    frame.Craft.MouseButton1Click.Connect(() => {
      if (!this.canCraft(ingredients)) return;
      if (kind === RecipeKind.Tool)
        messaging.server.emit(Message.Craft, RECIPES.indexOf(recipe));
      else if (kind === RecipeKind.Structure) {
        // TODO: enter build mode
      }
    });
    frame.Parent = this.storage;

    return frame;
  }

  private createIngredientFrame(parent: Frame, [id, count]: [number, number]): void {
    const item = getItemByID(id);
    if (!item) return;

    const frame = assets.UI.IngredientFrame.Clone();
    frame.Title.Text = count + " " + item.Name;
    frame.Title.TextColor3 = this.getTextColor(id, count);
    addViewportItem(frame.Viewport, id);

    frame.Parent = parent;
  }

  private getCraftButtonColor(ingredients: CraftingRecipe["ingredients"]): Color3 {
    const canCraft = this.canCraft(ingredients);
    return canCraft ? DEFAULT_CRAFT_BUTTON_COLOR : GRAYED_CRAFT_BUTTON_COLOR;
  }

  private canCraft(recipe: CraftingRecipe): boolean;
  private canCraft(ingredients: CraftingRecipe["ingredients"]): boolean;
  private canCraft(ingredients: CraftingRecipe["ingredients"] | CraftingRecipe): boolean {
    if ("ingredients" in ingredients) // lol
      ({ ingredients } = ingredients);

    return ingredients.every(([id, count]) => this.hasEnough(id, count));
  }

  private getTextColor(id: number, requiredCount: number): Color3 {
    return this.hasEnough(id, requiredCount)
      ? DEFAULT_TEXT_COLOR
      : NOT_ENOUGH_TEXT_COLOR;
  }


  private hasEnough(id: number, requiredCount: number): boolean {
    const itemCount = this.replica.data.inventory.get(id);
    return itemCount !== undefined && itemCount >= requiredCount;
  }
}