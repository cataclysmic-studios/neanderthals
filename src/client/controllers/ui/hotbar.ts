import { Controller } from "@flamework/core";
import { getChildrenOfType } from "@rbxts/instance-utility";
import { TweenBuilder, type TweenBuilderBase } from "@rbxts/twin";
import { Trash } from "@rbxts/trash";

import { Message, messaging } from "shared/messaging";
import { mainScreen } from "client/constants";
import { getDisplayName } from "shared/utility/items";
import { addViewportItem, removeViewportItem } from "client/utility";
import { ItemRegistry } from "shared/registry/item-registry";
import type { ItemID } from "shared/item-id";
import type { PlayerData } from "shared/structs/player-data";

import type { CharacterController } from "../character";
import type { InputController } from "../input";
import type { ToolController } from "../tool";
import { IDRegistry } from "shared/registry/id-registry";
import { HOTBAR_SLOTS } from "shared/constants";

const WHITE = new Color3(1, 1, 1);
const DEFAULT_VIEWPORT_COLOR = Color3.fromRGB(30, 30, 30);
const SELECTED_VIEWPORT_COLOR = DEFAULT_VIEWPORT_COLOR.Lerp(WHITE, 0.2);
const FADE_OUT_TWEEN_INFO = new TweenInfo(1);

@Controller()
export class HotbarUIController {
  private readonly frame = mainScreen.Hotbar;
  private readonly buttons = getChildrenOfType<"ImageButton", HotbarButton>(this.frame, "ImageButton");
  private readonly defaultButtonColor = this.frame.One.ImageColor3;
  private readonly selectedButtonColor = this.defaultButtonColor.Lerp(WHITE, 0.25);
  private readonly itemNameLabel = this.frame.Unlisted.ItemName;
  private readonly defaultStrokeTransparency = this.itemNameLabel.UIStroke.Transparency;
  private readonly itemLabelTrash = new Trash;
  private readonly itemLabelFadeOut: TweenBuilderBase<TextLabel>;
  private readonly itemLabelStrokeFadeOut: TweenBuilderBase<UIStroke>;
  private selectedButton?: HotbarButton;

  public constructor(
    character: CharacterController,
    input: InputController,
    private readonly tool: ToolController
  ) {
    input.onKeysDown([
      Enum.KeyCode.One,
      Enum.KeyCode.Two,
      Enum.KeyCode.Three,
      Enum.KeyCode.Four,
      Enum.KeyCode.Five,
      Enum.KeyCode.Six
    ], key => this.selectButton(key.Name));
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

  public addItem(id: string, slot?: HotbarKeyName): void {
    const button = slot !== undefined
      ? this.frame[slot]
      : this.getNextEmptyHotbarButton();

    if (!button) return;
    if (this.hasViewportItem(button)) return;

    slot ??= button.Name as never;
    messaging.server.emit(Message.AddHotbarItem, { id: IDRegistry.getIndex(id), slot });
  }

  public removeItem(hotbarButton: HotbarButton): void {
    if (this.selectedButton === hotbarButton)
      this.selectButton(hotbarButton);

    print("remove da hotbar item, slot:", hotbarButton.Name);
    messaging.server.emit(Message.RemoveHotbarItem, hotbarButton.Name as never);
  }

  public update(hotbar: PlayerData["hotbar"]): void {
    const { frame } = this;
    for (const slot of HOTBAR_SLOTS) {
      this.removeViewportItem(frame[slot]);
    }

    for (const [slot, id] of pairs(hotbar)) {
      const button = frame[slot];
      this.addViewportItem(button, IDRegistry.getID(id));
    }
  }

  public selectButton(hotbarButton: HotbarButton): void;
  public selectButton(hotbarSlot: HotbarKeyName): void;
  public selectButton(hotbarButton: HotbarButton | HotbarKeyName): void {
    if (typeIs(hotbarButton, "string")) {
      hotbarButton = this.frame[hotbarButton];
    }

    const tool = this.getViewportItem(hotbarButton);
    const otherEquipped = this.selectedButton !== hotbarButton && this.tool.hasEquipped(tool);
    if (!tool) return;

    const slot = hotbarButton.Name as HotbarKeyName;
    const equipped = otherEquipped
      ? this.tool.equip(tool, slot)
      : this.tool.toggleEquipped(tool, slot);

    this.selectedButton = equipped ? hotbarButton : undefined;
    this.updateSelectionColors();
    if (equipped) {
      this.showItemLabel(tool);
      TweenBuilder.for(hotbarButton.Viewport)
        .time(0.08)
        .style(Enum.EasingStyle.Quad)
        .reverse()
        .property("Size", UDim2.fromScale(1.35, 1.35))
        .play();
    }
  }

  private showItemLabel(item: Model): void {
    const { itemNameLabel, itemLabelTrash } = this;
    itemLabelTrash.purge();

    const displayName = getDisplayName(item);
    itemNameLabel.Text = displayName;
    itemNameLabel.UIStroke.Transparency = this.defaultStrokeTransparency;
    itemNameLabel.TextTransparency = 0;

    itemLabelTrash.add(task.delay(1.5, () => {
      itemLabelTrash.add(this.itemLabelFadeOut.build()).Play();
      itemLabelTrash.add(this.itemLabelStrokeFadeOut.build()).Play();
    }));
  }

  private addViewportItem(hotbarButton: HotbarButton, id: string): void {
    addViewportItem(hotbarButton.Viewport, id);
    hotbarButton.SetAttribute("CurrentItem", id);
  }

  private removeViewportItem(hotbarButton: HotbarButton): void {
    hotbarButton.SetAttribute("CurrentItem", undefined);
    removeViewportItem(hotbarButton.Viewport);
  }

  private getNextEmptyHotbarButton(): Maybe<HotbarButton> {
    return this.buttons.find(button => !this.hasViewportItem(button));
  }

  private hasViewportItem(hotbarButton: HotbarButton): boolean {
    return hotbarButton.GetAttribute("CurrentItem") !== undefined;
  }

  private getViewportItem(hotbarButton: HotbarButton): Maybe<ToolItem> {
    const itemID = hotbarButton.GetAttribute<ItemID>("CurrentItem");
    return itemID !== undefined
      ? ItemRegistry.get<ToolItem>(itemID)
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