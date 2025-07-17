import type { OnStart } from "@flamework/core";
import { Component } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";
import { $nameof } from "rbxts-transform-debug";

import DestroyableComponent from "shared/base-components/destroyable";

const CLOSED_COLOR = Color3.fromRGB(75, 151, 75);
const OPEN_COLOR = Color3.fromRGB(196, 40, 28);

@Component({
  tag: $nameof<Gate>(),
  ancestorWhitelist: [World]
})
export class Gate extends DestroyableComponent<{}, GateStructureModel> implements OnStart {
  private readonly door = this.instance.Door;
  private readonly buttonPart = this.instance.Button;
  private readonly button = this.buttonPart.ClickDetector;
  private open = false;

  public onStart(): void {
    this.buttonPart.Color = CLOSED_COLOR;
    this.trash.add(this.button.MouseClick.Connect(() => this.toggleOpen()));
  }

  private toggleOpen(): void {
    const { door } = this;
    const on = this.open = !this.open;
    this.buttonPart.Color = on ? OPEN_COLOR : CLOSED_COLOR;
    door.Transparency = on ? 1 : 0;
    door.CanCollide = !on;
    door.CanQuery = !on;
  }
}