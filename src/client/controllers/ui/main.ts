import { Controller } from "@flamework/core";
import { Trash } from "@rbxts/trash";

import type { OnCharacterAdd } from "client/hooks";
import { Message, messaging } from "shared/messaging";
import { playerGUI } from "client/constants";

import type { CharacterController } from "../character";

const { delay } = task;

const DAMAGE_DISPLAY_LIFETIME = 1;

@Controller()
export class MainUIController implements OnCharacterAdd {
  private readonly screen = playerGUI.WaitForChild("Main");
  private readonly damageDisplay = this.screen.DamageDisplay;
  private readonly stats = this.screen.Stats;
  private readonly damageTrash = new Trash;
  private hunger = 100;

  public constructor(
    private readonly character: CharacterController
  ) {
    messaging.client.on(Message.UpdateHunger, hunger => this.updateStats(this.hunger = hunger));
    messaging.client.on(Message.ShowDamageDisplay, humanoid => this.showDamageDisplay(humanoid));
  }

  public onCharacterAdd(character: CharacterModel): void {
    this.updateStats();
    const humanoid = character.Humanoid;
    const conn = humanoid.GetPropertyChangedSignal("Health").Connect(() => {
      this.updateStats();
      if (humanoid.Health > 0) return;
      conn.Disconnect();
    });
  }

  public enableDamageDisplay(humanoid: Humanoid): void {
    const { damageDisplay } = this;
    const healthBar = damageDisplay.Health;
    const health = humanoid.Health;
    healthBar.Amount.Text = tostring(health); // TODO: comma format
    healthBar.Bar.Size = UDim2.fromScale(health / humanoid.MaxHealth, 1);

    damageDisplay.Title.Text = humanoid.Parent!.Name.upper();
    damageDisplay.Visible = true;
  }

  public disableDamageDisplay(): void {
    this.damageDisplay.Visible = false;
  }

  private showDamageDisplay(humanoid: Humanoid) {
    this.damageTrash.purge();
    this.enableDamageDisplay(humanoid);

    const isDead = humanoid.Health <= 0;
    const lifetime = DAMAGE_DISPLAY_LIFETIME * (isDead ? 0.5 : 1);
    this.damageTrash.add(delay(lifetime, () => this.disableDamageDisplay()));
  }

  private updateStats(hunger = this.hunger): void {
    const humanoid = this.character.getHumanoid();
    if (!humanoid) return;

    const { stats } = this;
    stats.BagSpace.Bar.Size = UDim2.fromScale(0, 1);
    stats.Hunger.Bar.Size = UDim2.fromScale(hunger / 100, 1);
    stats.Health.Bar.Size = UDim2.fromScale(humanoid.Health / humanoid.MaxHealth, 1);
  }
}