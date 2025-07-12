import { Controller } from "@flamework/core";
import { getChildrenOfType } from "@rbxts/instance-utility";
import ViewportModel from "@rbxts/viewport-model";

import { playerGUI } from "client/constants";
import { getItemByID } from "shared/utility";

import type { ToolController } from "../tool";
import { Message, messaging } from "shared/messaging";

@Controller()
export class HotbarUIController {
  public readonly screen = playerGUI.WaitForChild("Main");

  private readonly hotbarButtons = getChildrenOfType<"ImageButton", HotbarButton>(this.screen.Hotbar, "ImageButton");

  public constructor(
    private readonly tool: ToolController
  ) {
    for (const button of this.hotbarButtons) {
      button.MouseButton1Click.Connect(() => this.onButtonClick(button));
      button.MouseButton2Click.Connect(() => this.onButtonRightClick(button));
    }
  }

  public addItem(id: number, slot?: number): void {
    const button = slot !== undefined
      ? this.hotbarButtons[slot]
      : this.getNextEmptyHotbarButton();

    if (!button) return;
    if (this.hasViewportItem(button)) return;

    // update data
    messaging.server.emit(Message.AddHotbarItem, { id, slot });
    this.addViewportItem(button, id);
  }

  public removeItem(hotbarButton: HotbarButton): void {
    // update data
    this.removeViewportItem(hotbarButton);
    messaging.server.emit(Message.RemoveHotbarItem, hotbarButton.LayoutOrder);
  }

  public update(items: number[]): void {
    const buttons = this.hotbarButtons;
    let i = 0;

    for (const id of items) {
      const button = buttons[i++];
      if (this.hasViewportItem(button))
        this.removeViewportItem(button);

      this.addViewportItem(button, id);
    }
  }

  private addViewportItem(hotbarButton: HotbarButton, id: number): void {
    (ViewportModel as { GenerateViewport: Callback }).GenerateViewport(hotbarButton.Viewport, getItemByID(id)?.Clone()); // DUM DUM HACK BC THIS MODULE IS TYPED INCORRECTLY
    hotbarButton.SetAttribute("CurrentItem", id);
  }

  private removeViewportItem(hotbarButton: HotbarButton): void {
    hotbarButton.SetAttribute("CurrentItem", undefined);
    (ViewportModel as { CleanViewport: Callback }).CleanViewport(hotbarButton.Viewport);
  }

  private getNextEmptyHotbarButton(): Maybe<HotbarButton> {
    return this.hotbarButtons.find(button => !this.hasViewportItem(button));
  }

  private hasViewportItem(hotbarButton: HotbarButton): boolean {
    return hotbarButton.GetAttribute("CurrentItem") !== undefined;
  }

  private getViewportItem(hotbarButton: HotbarButton): Maybe<ToolItem> {
    const itemID = hotbarButton.GetAttribute<number>("CurrentItem");
    return itemID !== undefined ? getItemByID(itemID) : undefined;
  }

  private onButtonClick(hotbarButton: HotbarButton): void {
    const tool = this.getViewportItem(hotbarButton);
    if (!tool) return;

    this.tool.toggleEquipped(tool);
  }

  private onButtonRightClick(hotbarButton: HotbarButton): void {
    const tool = this.getViewportItem(hotbarButton);
    if (!tool) return;

    this.removeItem(hotbarButton);
  }
}