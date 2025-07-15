import { Controller } from "@flamework/core";
import { Trash } from "@rbxts/trash";
import { atom, subscribe } from "@rbxts/charm";
import Signal from "@rbxts/lemon-signal";

import { mainScreen, player } from "client/constants";
import { assets, TRIBE_COLORS } from "shared/constants";
import { Teams } from "@rbxts/services";

const GRAYED_BUTTON_COLOR = new Color3(0.3, 0.3, 0.3);

@Controller()
export class TribesUIController {
  public readonly toggled = new Signal<(on: boolean) => void>;

  private readonly frame = mainScreen.Tribes;
  private readonly visibleTrash = new Trash;

  public constructor() {
    this.frame.GetPropertyChangedSignal("Visible").Connect(() => {
      if (this.frame.Visible) return;
      this.visibleTrash.destroy();
    });

    this.update();
  }

  private update(): void {
    const tribeTeam = player.Team;
    if (!tribeTeam || tribeTeam === Teams.NoTribe)
      this.handleNoTribe();
    else {

    }
  }

  private handleNoTribe(): void {
    const noTribe = this.frame.NoTribe;
    const defaultButtonColor = noTribe.Create.BackgroundColor3;
    noTribe.Visible = true;

    const selectedColor = atom<Maybe<BrickColor>>(undefined);
    noTribe.Create.BackgroundColor3 = GRAYED_BUTTON_COLOR;
    subscribe(selectedColor, color =>
      noTribe.Create.BackgroundColor3 = color !== undefined ? defaultButtonColor : GRAYED_BUTTON_COLOR
    );

    this.visibleTrash.add(noTribe.Create.MouseButton1Click.Connect(() => {
      const color = selectedColor();
      if (!color) return;
      print("selected", color);
      // send create tribe message
    }));

    for (const color of TRIBE_COLORS) {
      const button = assets.UI.ColorButton.Clone();
      button.BackgroundColor3 = color.Color;
      button.Parent = noTribe.Colors;
      this.visibleTrash.add(button.MouseButton1Click.Connect(() => selectedColor(color)));
    }
  }

  public toggle(on = !this.frame.Visible): void {
    if (this.frame.Visible === on) return;
    this.frame.Visible = on;
    this.toggled.Fire(on);
  }

  public isEnabled(): boolean {
    return this.frame.Visible;
  }
}