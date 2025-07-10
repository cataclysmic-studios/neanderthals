import { Controller } from "@flamework/core";
import { Trash } from "@rbxts/trash";

import { Message, messaging } from "shared/messaging";
import { playerGUI } from "client/constants";

import type { CharacterController } from "../character";

const { delay } = task;

const DAMAGE_DISPLAY_LIFETIME = 1;

@Controller()
export class MainUIController {
  private readonly screen = playerGUI.WaitForChild("Main");
  private readonly damageDisplay = this.screen.DamageDisplay;
  private readonly stats = this.screen.Stats;
  private readonly damageTrash = new Trash;

  public constructor(
    private readonly character: CharacterController
  ) {
    this.updateStats(100);
    messaging.client.on(Message.UpdateHunger, hunger => this.updateStats(hunger));
    messaging.client.on(Message.ShowDamageDisplay, humanoid => this.showDamageDisplay(humanoid));
  }

  public enableDamageDisplay(humanoid: Humanoid): void {
    const healthBar = this.damageDisplay.Health;
    const health = humanoid.Health;
    healthBar.Amount.Text = tostring(health); // TODO: comma format
    healthBar.Bar.Size = UDim2.fromScale(health / humanoid.MaxHealth, 1);

    this.damageDisplay.Title.Text = humanoid.Parent!.Name.upper();
    this.damageDisplay.Visible = true;
  }

  public disableDamageDisplay(): void {
    this.damageDisplay.Visible = false;
  }

  private showDamageDisplay(humanoid: Humanoid) {
    this.damageTrash.purge();
    this.enableDamageDisplay(humanoid);
    this.damageTrash.add(delay(DAMAGE_DISPLAY_LIFETIME, () => this.disableDamageDisplay()));
  }

  private updateStats(hunger: number): void {
    const humanoid = this.character.getHumanoid();
    if (!humanoid) return;

    this.stats.BagSpace.Bar.Size = UDim2.fromScale(0, 1);
    this.stats.Hunger.Bar.Size = UDim2.fromScale(hunger / 100, 1);
    this.stats.Health.Bar.Size = UDim2.fromScale(humanoid.Health / humanoid.MaxHealth, 1);
  }
}