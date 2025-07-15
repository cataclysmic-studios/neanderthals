import { Controller } from "@flamework/core";
import { getChildrenOfType } from "@rbxts/instance-utility";
import { TweenBuilder, type TweenBuilderBase } from "@rbxts/twin";
import { Trash } from "@rbxts/trash";

import { Message, messaging } from "shared/messaging";
import { mainScreen } from "client/constants";
import { getDisplayName, getItemByID } from "shared/utility/items";
import { addViewportItem, removeViewportItem } from "client/utility";
import type { PlayerData } from "shared/structs/player-data";

import type { CharacterController } from "../character";
import type { ToolController } from "../tool";

const WHITE = new Color3(1, 1, 1);
const DEFAULT_VIEWPORT_COLOR = Color3.fromRGB(30, 30, 30);
const SELECTED_VIEWPORT_COLOR = DEFAULT_VIEWPORT_COLOR.Lerp(WHITE, 0.25);
const FADE_OUT_TWEEN_INFO = new TweenInfo(1);

@Controller()
export class HotbarUIController {
  private readonly frame = mainScreen.Hotbar;
  private readonly buttons = getChildrenOfType<"ImageButton", HotbarButton>(this.frame, "ImageButton");
  private readonly defaultButtonColor = this.buttons.first()!.ImageColor3;
  private readonly selectedButtonColor = this.defaultButtonColor.Lerp(WHITE, 0.25);
  private readonly itemNameLabel = this.frame.Unlisted.ItemName;
  private readonly defaultStrokeTransparency = this.itemNameLabel.UIStroke.Transparency;
  private readonly itemLabelTrash = new Trash;
  private readonly itemLabelFadeOut: TweenBuilderBase<TextLabel>;
  private readonly itemLabelStrokeFadeOut: TweenBuilderBase<UIStroke>;
  private selectedButton?: HotbarButton;

  public constructor(
    character: CharacterController,
    private readonly tool: ToolController
  ) {
    character.died.Connect(() => {
      if (!this.selectedButton) return;
      this.onButtonClick(this.selectedButton);
    });

    const { itemNameLabel } = this;
    itemNameLabel.TextTransparency = 1;
    itemNameLabel.UIStroke.Transparency = 1;
    itemNameLabel.Visible = true;

    this.itemLabelFadeOut = TweenBuilder.for(itemNameLabel)
      .info(FADE_OUT_TWEEN_INFO)
      .property("TextTransparency", 1);
    this.itemLabelStrokeFadeOut = TweenBuilder.for(itemNameLabel.UIStroke)
      .info(FADE_OUT_TWEEN_INFO)
      .property("Transparency", 1);

    for (const button of this.buttons) {
      button.MouseButton1Click.Connect(() => this.onButtonClick(button));
      button.MouseButton2Click.Connect(() => this.onButtonRightClick(button));
    }
  }

  public addItem(id: number, slot?: number): void {
    const button = slot !== undefined
      ? this.buttons[slot]
      : this.getNextEmptyHotbarButton();

    if (!button) return;
    if (this.hasViewportItem(button)) return;

    messaging.server.emit(Message.AddHotbarItem, { id, slot });
    this.addViewportItem(button, id);
  }

  public removeItem(hotbarButton: HotbarButton): void {
    if (this.selectedButton === hotbarButton)
      this.selectButton(hotbarButton);

    this.removeViewportItem(hotbarButton);
    messaging.server.emit(Message.RemoveHotbarItem, hotbarButton.LayoutOrder);
  }

  public update(items: PlayerData["hotbar"]): void {
    const { buttons } = this;
    for (const [i, id] of pairs(items)) {
      const button = buttons[i - 1];
      if (this.hasViewportItem(button))
        this.removeViewportItem(button);

      if (id === undefined) continue;
      this.addViewportItem(button, id);
    }
  }

  public selectButton(hotbarButton: HotbarButton): void
  public selectButton(hotbarSlot: number): void
  public selectButton(hotbarButton: HotbarButton | number): void {
    if (typeIs(hotbarButton, "number"))
      hotbarButton = this.buttons[hotbarButton];

    const tool = this.getViewportItem(hotbarButton);
    const currentlyEquippedButNotThisSlot = this.selectedButton !== hotbarButton && this.tool.hasEquipped(tool); // lol
    if (!tool) return;

    const equipped = currentlyEquippedButNotThisSlot
      ? this.tool.equip(tool) as undefined || true
      : this.tool.toggleEquipped(tool);

    this.selectedButton = equipped ? hotbarButton : undefined;
    this.updateSelectionColors();
    if (equipped)
      this.showItemLabel(tool);
  }

  private showItemLabel(item: Model): void {
    const { itemNameLabel, itemLabelTrash } = this;
    itemLabelTrash.purge();

    const displayName = getDisplayName(item);
    itemNameLabel.Text = displayName;
    itemNameLabel.UIStroke.Transparency = this.defaultStrokeTransparency;
    itemNameLabel.TextTransparency = 0;

    itemLabelTrash.add(task.delay(1.5, () => {
      itemLabelTrash.add(this.itemLabelFadeOut.build()).Play()
      itemLabelTrash.add(this.itemLabelStrokeFadeOut.build()).Play()
    }));
  }

  private addViewportItem(hotbarButton: HotbarButton, id: number): void {
    addViewportItem(hotbarButton.Viewport, id);
    hotbarButton.SetAttribute("CurrentItem", id);
  }

  private removeViewportItem(hotbarButton: HotbarButton): void {
    hotbarButton.SetAttribute("CurrentItem", undefined);
    removeViewportItem(hotbarButton.Viewport)
  }

  private getNextEmptyHotbarButton(): Maybe<HotbarButton> {
    return this.buttons.find(button => !this.hasViewportItem(button));
  }

  private hasViewportItem(hotbarButton: HotbarButton): boolean {
    return hotbarButton.GetAttribute("CurrentItem") !== undefined;
  }

  private getViewportItem(hotbarButton: HotbarButton): Maybe<ToolItem> {
    const itemID = hotbarButton.GetAttribute<number>("CurrentItem");
    return itemID !== undefined
      ? getItemByID<ToolItem>(itemID)
      : undefined;
  }

  private onButtonClick(hotbarButton: HotbarButton): void {
    this.selectButton(hotbarButton);
  }

  private onButtonRightClick(hotbarButton: HotbarButton): void {
    const tool = this.getViewportItem(hotbarButton);
    if (!tool) return;

    this.removeItem(hotbarButton);
  }

  private updateSelectionColors(): void {
    for (const hotbarButton of this.buttons) {
      const isSelected = hotbarButton === this.selectedButton;
      hotbarButton.ImageColor3 = isSelected ? this.selectedButtonColor : this.defaultButtonColor;
      hotbarButton.Viewport.BackgroundColor3 = isSelected ? SELECTED_VIEWPORT_COLOR : DEFAULT_VIEWPORT_COLOR;
    }
  }
}