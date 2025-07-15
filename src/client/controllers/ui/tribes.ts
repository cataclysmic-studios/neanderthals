import { Controller } from "@flamework/core";
import { Teams } from "@rbxts/services";
import { Trash } from "@rbxts/trash";
import { atom, subscribe } from "@rbxts/charm";
import Signal from "@rbxts/lemon-signal";

import { Message, messaging } from "shared/messaging";
import { assets, TRIBE_COLORS } from "shared/constants";
import { mainScreen, player } from "client/constants";

import type { CharacterController } from "../character";

const GRAYED_BUTTON_COLOR = new Color3(0.3, 0.3, 0.3);

@Controller()
export class TribesUIController {
  public readonly toggled = new Signal<(on: boolean) => void>;

  private readonly frame = mainScreen.Tribes;
  private readonly visibleTrash = new Trash;

  public constructor(character: CharacterController) {
    this.frame.GetPropertyChangedSignal("Visible").Connect(() => {
      if (this.frame.Visible) return;
      this.visibleTrash.purge();
      this.update();
    });

    this.update();
    character.died.Connect(() => this.update());
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
    this.visibleTrash.add(subscribe(selectedColor, color =>
      noTribe.Create.BackgroundColor3 = color !== undefined ? defaultButtonColor : GRAYED_BUTTON_COLOR
    ));

    this.visibleTrash.add(noTribe.Create.MouseButton1Click.Connect(() => {
      const color = selectedColor();
      if (!color) return;

      messaging.server.emit(Message.CreateTribe, color.Name as never);
      noTribe.Visible = false;
    }));

    for (const color of TRIBE_COLORS) {
      const button = this.visibleTrash.add(assets.UI.ColorButton.Clone());
      button.Name = color.Name;
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