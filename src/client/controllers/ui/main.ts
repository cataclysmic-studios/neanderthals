import { Controller } from "@flamework/core";

import { Message, messaging } from "shared/messaging";
import { playerGUI } from "client/constants";

import type { CharacterController } from "../character";

@Controller()
export class MainUIController {
  private readonly screen = playerGUI.WaitForChild("Main");
  private readonly damageDisplay = this.screen.DamageDisplay;
  private readonly stats = this.screen.Stats;

  public constructor(
    private readonly character: CharacterController
  ) {
    this.updateStats(100);
    messaging.client.on(Message.UpdateHunger, hunger => this.updateStats(hunger));
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

  private updateStats(hunger: number): void {
    const humanoid = this.character.getHumanoid();
    if (!humanoid) return;

    this.stats.BagSpace.Bar.Size = UDim2.fromScale(0, 1);
    this.stats.Hunger.Bar.Size = UDim2.fromScale(hunger / 100, 1);
    this.stats.Health.Bar.Size = UDim2.fromScale(humanoid.Health / humanoid.MaxHealth, 1);
  }
}