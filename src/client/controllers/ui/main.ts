import { Controller } from "@flamework/core";
import { Trash } from "@rbxts/trash";

import type { OnCharacterAdd } from "client/hooks";
import { Message, messaging } from "shared/messaging";
import { playerGUI } from "client/constants";

import type { CharacterController } from "../character";

const { delay } = task;

const DAMAGE_DISPLAY_LIFETIME = 1;

@Controller({ loadOrder: -1 })
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

  public showDamageDisplay(humanoid: Humanoid): void;
  public showDamageDisplay(name: string, health: number, maxHealth: number): void;
  public showDamageDisplay(humanoid: Humanoid | string, health?: number, maxHealth?: number): void {
    const { damageTrash, damageDisplay } = this;
    damageTrash.purge();

    const healthBar = damageDisplay.Health;
    if (!typeIs(humanoid, "string")) {
      health = humanoid.Health;
      maxHealth = humanoid.MaxHealth;
    }

    healthBar.Amount.Text = tostring(health); // TODO: comma format
    healthBar.Bar.Size = UDim2.fromScale(health! / maxHealth!, 1);

    const name = typeIs(humanoid, "string") ? humanoid : humanoid.Parent!.Name.upper();
    damageDisplay.Title.Text = name;
    damageDisplay.Visible = true;

    const isAlive = health! > 0;
    const lifetime = DAMAGE_DISPLAY_LIFETIME * (isAlive ? 1 : 0.5);
    damageTrash.add(delay(lifetime, () => this.damageDisplay.Visible = false));
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