import { Controller } from "@flamework/core";
import { StarterGui } from "@rbxts/services";
import { Trash } from "@rbxts/trash";
import Signal from "@rbxts/lemon-signal";

import type { OnCharacterAdd } from "client/hooks";
import { Message, messaging } from "shared/messaging";
import { mainScreen } from "client/constants";
import { getXPToLevelUp } from "shared/utility";
import { calculateBagSpace, getMaxBagSpace } from "shared/utility/data";

import type { ReplicaController } from "../replica";
import type { CharacterController } from "../character";
import type { HotbarUIController } from "./hotbar";
import { ActionButtonsUIController } from "./action-buttons";
import { InventoryUIController } from "./inventory";
import { TribesUIController } from "./tribes";

const { floor } = math;
const { delay } = task;

const DAMAGE_DISPLAY_LIFETIME = 1;

@Controller({ loadOrder: -1 })
export class MainUIController implements OnCharacterAdd {
  private readonly damageDisplay = mainScreen.DamageDisplay;
  private readonly stats = mainScreen.Stats;
  private readonly levelStats = mainScreen.LevelStats;
  private readonly damageTrash = new Trash;
  private hunger = 100;

  public constructor(
    private readonly replica: ReplicaController,
    private readonly character: CharacterController,
    private readonly actionButtonsUI: ActionButtonsUIController,
    hotbarUI: HotbarUIController,
    inventoryUI: InventoryUIController,
    tribesUI: TribesUIController
  ) {
    messaging.client.on(Message.UpdateHunger, hunger => this.updateStats(this.hunger = hunger));
    messaging.client.on(Message.ShowDamageDisplay, humanoid => this.showDamageDisplay(humanoid));

    const hideMainUIs = [inventoryUI, tribesUI];
    const tryEnableMain = () => {
      if (!hideMainUIs.every(ui => !ui.isEnabled())) return;
      this.toggle(true);
    };

    inventoryUI.toggled.Connect(on => {
      if (!on)
        return tryEnableMain();

      this.toggle(false);
      tribesUI.toggle(false);
    });
    tribesUI.toggled.Connect(on => {
      if (!on)
        return tryEnableMain();

      this.toggle(false)
      inventoryUI.toggle(false);
    });
    replica.updated.Connect(data => {
      hotbarUI.update(data.hotbar);
      this.updateStats();
      this.updateLevelStats();
    });
  }

  public onCharacterAdd(character: CharacterModel): void {
    this.updateStats();
    const humanoid = character.Humanoid;
    const conn = humanoid.GetPropertyChangedSignal("Health").Connect(() => {
      this.updateStats();
      if (humanoid.Health > 0) return;
      conn.Disconnect();
    });

    StarterGui.SetCoreGuiEnabled("All", false);
    StarterGui.SetCoreGuiEnabled("Chat", true);
  }

  public toggle(on: boolean): void {
    this.actionButtonsUI.toggle(on);
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

    health = health!;
    maxHealth = maxHealth!;
    healthBar.Amount.Text = tostring(floor(health)); // TODO: comma format
    healthBar.Bar.Size = UDim2.fromScale(health / maxHealth, 1);

    const name = typeIs(humanoid, "string") ? humanoid : humanoid.Parent!.Name.upper();
    damageDisplay.Title.Text = name;
    damageDisplay.Visible = true;

    const isAlive = health > 0;
    const lifetime = DAMAGE_DISPLAY_LIFETIME * (isAlive ? 1 : 0.5);
    damageTrash.add(delay(lifetime, () => this.damageDisplay.Visible = false));
  }

  private updateLevelStats(): void {
    const { levelStats } = this;
    const { xp, level } = this.replica.data;
    const xpToLevelUp = getXPToLevelUp(level);
    const xpFrame = levelStats.XP;
    xpFrame.Bar.Size = UDim2.fromScale(xp / xpToLevelUp, 1);
    xpFrame.Amount.Text = xp + " xp";
    levelStats.Level.Text = tostring(level);
  }

  private updateStats(hunger = this.hunger): void {
    const humanoid = this.character.getHumanoid();
    if (!humanoid) return;

    const { replica: { data }, stats } = this;
    const maxBagSpace = getMaxBagSpace(data.equippedGear);
    const bagSpace = calculateBagSpace(data.hotbar, data.inventory);
    stats.BagSpace.Bar.Size = UDim2.fromScale(bagSpace / maxBagSpace, 1);
    stats.Hunger.Bar.Size = UDim2.fromScale(hunger / 100, 1);
    stats.Health.Bar.Size = UDim2.fromScale(humanoid.Health / humanoid.MaxHealth, 1);
  }
}