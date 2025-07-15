import { Controller } from "@flamework/core";
import { TweenBuilder, type TweenBuilderBase } from "@rbxts/twin";
import { getChildrenOfType } from "@rbxts/instance-utility";

import { mainScreen } from "client/constants";

import type { InventoryUIController } from "./inventory";

const TWEEN_INFO = new TweenInfo(0.12);

@Controller()
export class ActionButtonsUIController {
  private readonly frame = mainScreen.ActionButtons;

  public constructor(inventoryUI: InventoryUIController) {
    const inventory = this.frame.Inventory;
    const tribes = this.frame.Tribes;
    inventory.MouseButton1Click.Connect(() => inventoryUI.toggle());
    tribes.MouseButton1Click.Connect(() => { }) // open tribes UI

    const buttons = getChildrenOfType(this.frame, "GuiButton");
    for (const button of buttons)
      this.applyAnimations(button);
  }

  public toggle(on: boolean) {
    this.frame.Visible = on;
  }

  private applyAnimations(button: GuiButton): void {
    const hoverScale = 1.1;
    const hoverBrightness = 1.25;
    const originalColor = button.BackgroundColor3;
    const [hue, saturation, value] = originalColor.ToHSV();
    const hoverColor = Color3.fromHSV(hue, saturation, value * hoverBrightness);
    const originalSize = button.Size;
    const hoverSize = UDim2.fromScale(originalSize.X.Scale * hoverScale, originalSize.Y.Scale * hoverScale);

    const enterTweenBuilder = TweenBuilder.for(button)
      .info(TWEEN_INFO)
      .propertiesBulk({
        BackgroundColor3: hoverColor,
        Size: hoverSize
      });
    const exitTweenBuilder = TweenBuilder.for(button)
      .info(TWEEN_INFO)
      .propertiesBulk({
        BackgroundColor3: originalColor,
        Size: originalSize
      });

    const playTween = (builder: TweenBuilderBase<GuiButton>) => builder.build().Play();
    button.MouseEnter.Connect(() => playTween(enterTweenBuilder));
    button.MouseLeave.Connect(() => playTween(exitTweenBuilder));
  }
}