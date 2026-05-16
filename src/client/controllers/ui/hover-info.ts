import { Controller } from "@flamework/core";
import { TweenBuilder } from "@rbxts/twin";

import { mainScreen } from "client/constants";
import { getDisplayName } from "shared/utility/items";

const HOVER_INFO_FADE_DURATION = 0.1;

@Controller()
export class HoverInfoUIController {
  private readonly hoverInfo = mainScreen.HoverInfo;
  private readonly baseHoverInfoPosition = this.hoverInfo.Position;
  private readonly tweenBuilder = TweenBuilder.for(this.hoverInfo).time(HOVER_INFO_FADE_DURATION);
  private readonly strokeTweenBuilder = TweenBuilder.for(this.hoverInfo.UIStroke).time(HOVER_INFO_FADE_DURATION);
  private currentItem?: Model;

  public getCurrent(): Maybe<Model> {
    return this.currentItem;
  }

  public enable(item: Model): void {
    const { hoverInfo } = this;
    hoverInfo.Title.Text = getDisplayName(item);
    hoverInfo.ID.Text = item.GetAttribute<string>("ID")!;
    this.currentItem = item;
    this.tweenTransparency(0);
  }

  public disable(): void {
    this.tweenTransparency(1);
    this.currentItem = undefined;
  }

  public updatePosition(x: number, y: number): void {
    this.hoverInfo.Position = this.baseHoverInfoPosition.add(UDim2.fromOffset(x, y));
  }

  private tweenTransparency(transparency: number): void {
    this.tweenBuilder
      .property("GroupTransparency", transparency)
      .play();
    this.strokeTweenBuilder
      .property("Transparency", math.max(transparency, 0.6))
      .play();
  }
}