import type { OnStart } from "@flamework/core";
import { Component } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";
import { $nameof } from "rbxts-transform-debug";

import DestroyableComponent from "shared/base-components/destroyable";

@Component({
  tag: $nameof<Gate>(),
  ancestorWhitelist: [World]
})
export class Gate extends DestroyableComponent<{}, GateStructureModel> implements OnStart {
  private readonly door = this.instance.Door;
  private readonly button = this.instance.Button.ClickDetector;
  private open = false;

  public onStart(): void {
    this.trash.add(this.button.MouseClick.Connect(() => this.toggleOpen()));
  }

  private toggleOpen(): void {
    const on = this.open = !this.open;
    this.door.Transparency = on ? 1 : 0;
    this.door.CanCollide = !on;
    this.door.CanQuery = !on;
  }
}