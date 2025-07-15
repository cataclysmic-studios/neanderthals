import { Controller } from "@flamework/core";
import Signal from "@rbxts/lemon-signal";

import { mainScreen } from "client/constants";

@Controller()
export class TribesUIController {
  public readonly toggled = new Signal<(on: boolean) => void>

  private readonly frame = mainScreen.Tribes;

  public constructor() {

  }

  public toggle(on = !this.frame.Visible): void {
    if (this.frame.Visible === on) return;
    this.frame.Visible = on;
    this.toggled.Fire(on);
  }
}