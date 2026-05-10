import { Controller } from "@flamework/core";
import { getChildrenOfType } from "@rbxts/instance-utility";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import { mainScreen } from "client/constants";
import { addViewportItem } from "client/utility";
import { getDisplayName } from "shared/utility/items";
import { ItemRegistry } from "shared/registry/item-registry";
import { StructureRegistry } from "shared/registry/structure-registry";
import { RecipeRegistry } from "shared/registry/recipe-registry";
import { RecipeKind, type CraftingRecipe } from "shared/structs/crafting-recipe";

import type { ReplicaController } from "../replica";
import type { BuildingController } from "../building";
import type { InventoryUIController } from "./inventory";
import type { ContentController } from "../content";
import { TweenBuilder } from "@rbxts/twin";
import { StructureID } from "shared/structure-id";

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
    private readonly replica: ReplicaController,
    private readonly building: BuildingController,
    content: ContentController,
    inventoryUI: InventoryUIController
  ) {
    inventoryUI.toggled.Connect(on => this.frame.Visible = on);
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

    this.rerenderRecipeFrames();
    content.synced.Connect(() => this.rerenderRecipeFrames());
  }

  private rerenderRecipeFrames(): void {
    for (const [recipe, frame] of this.frames) {
      this.frames.delete(recipe);
      frame.Destroy();
    }
    for (const recipe of RecipeRegistry.getAll()) {
      if (recipe.yield === StructureID.TribeTotem) continue; // no visible totem recipe

      const frame = this.createRecipeFrame(recipe);
      if (!frame) continue;

      this.frames.set(recipe, frame);
    }
  }

  private createRecipeFrame(recipe: CraftingRecipe): Maybe<RecipeFrame> {
    const { kind, yield: yieldItem, ingredients, requiredLevel } = recipe;
    const yieldID = typeIs(yieldItem, "string") ? yieldItem : yieldItem[0];
    const model = recipe.kind === RecipeKind.Structure
      ? StructureRegistry.get(yieldID)
      : ItemRegistry.get(yieldID);

    // TODO: required level UI
    const frame = assets.UI.CraftingRecipeFrame.Clone();
    for (const ingredient of ingredients)
      this.createIngredientFrame(frame.Ingredients, ingredient);

    addViewportItem(frame.Viewport, model);
    frame.Title.Text = getDisplayName(model);

    const color = this.getCraftButtonColor(ingredients);
    const craftButton = frame.Craft;
    craftButton.BackgroundColor3 = color;
    craftButton.MouseButton1Click.Connect(() => {
      if (!this.canCraft(ingredients)) return;
      if (kind === RecipeKind.Item)
        messaging.server.emit(Message.Craft, RecipeRegistry.getIndex(recipe));
      else if (kind === RecipeKind.Structure)
        this.building.enterBuildMode(model as StructureModel);
    });
    craftButton.MouseEnter.Connect(() => {
      if (!this.canCraft(ingredients)) return;
      TweenBuilder.for(craftButton.Border)
        .time(0.1)
        .style(Enum.EasingStyle.Sine)
        .property("Color", new Color3(1, 1, 1))
        .play();
    });
    craftButton.MouseLeave.Connect(() => {
      TweenBuilder.for(craftButton.Border)
        .time(0.1)
        .style(Enum.EasingStyle.Sine)
        .property("Color", new Color3(0, 0, 0))
        .play();
    });
    frame.Parent = this.storage;

    return frame;
  }

  private createIngredientFrame(parent: Frame, [id, count]: [string, number]): void {
    const item = ItemRegistry.get(id);
    if (!item) return;

    const frame = assets.UI.IngredientFrame.Clone();
    frame.Title.Text = count + " " + getDisplayName(item, { uppercase: false });
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

  private getTextColor(id: string, requiredCount: number): Color3 {
    return this.hasEnough(id, requiredCount)
      ? DEFAULT_TEXT_COLOR
      : NOT_ENOUGH_TEXT_COLOR;
  }

  private hasEnough(id: string, requiredCount: number): boolean {
    const itemCount = this.replica.data.inventory[id];
    return itemCount !== undefined && itemCount >= requiredCount;
  }
}