import { Controller } from "@flamework/core";
import { getChildrenOfType } from "@rbxts/instance-utility";

import { Message, messaging } from "shared/messaging";
import { mainScreen } from "client/constants";
import { getItemByID } from "shared/utility/items";
import { addViewportItem, removeViewportItem } from "client/utility";

import type { CharacterController } from "../character";
import type { ToolController } from "../tool";
import { PlayerData } from "shared/structs/player-data";

const WHITE = new Color3(1, 1, 1);
const DEFAULT_VIEWPORT_COLOR = Color3.fromRGB(30, 30, 30);
const SELECTED_VIEWPORT_COLOR = DEFAULT_VIEWPORT_COLOR.Lerp(WHITE, 0.25);

@Controller()
export class HotbarUIController {
  private readonly buttons: readonly HotbarButton[] = getChildrenOfType<"ImageButton", HotbarButton>(mainScreen.Hotbar, "ImageButton");
  private readonly defaultButtonColor = this.buttons.first()!.ImageColor3;
  private readonly selectedButtonColor = this.defaultButtonColor.Lerp(WHITE, 0.25);
  private selectedButton?: HotbarButton;

  public constructor(
    character: CharacterController,
    private readonly tool: ToolController
  ) {
    character.died.Connect(() => {
      if (!this.selectedButton) return;
      this.onButtonClick(this.selectedButton);
    });
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
    if (!tool) return;

    this.selectedButton = this.tool.toggleEquipped(tool) ? hotbarButton : undefined;
    this.updateSelectionColors();
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
    return itemID !== undefined ? getItemByID(itemID) : undefined;
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