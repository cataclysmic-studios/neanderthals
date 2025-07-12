import { Controller } from "@flamework/core";
import { Trash } from "@rbxts/trash";
import { getChildrenOfType } from "@rbxts/instance-utility";
import ViewportModel from "@rbxts/viewport-model";
import Signal from "@rbxts/lemon-signal";

import type { OnCharacterAdd } from "client/hooks";
import { Message, messaging } from "shared/messaging";
import { playerGUI } from "client/constants";
import { calculateBagSpace, getBagSpace, getItemByID } from "shared/utility";

import type { ReplicaController } from "../replica";
import type { CharacterController } from "../character";
import type { ToolController } from "../tool";
import { StarterGui } from "@rbxts/services";

const { delay } = task;

const DAMAGE_DISPLAY_LIFETIME = 1;

@Controller({ loadOrder: -1 })
export class MainUIController implements OnCharacterAdd {
  public readonly screen = playerGUI.WaitForChild("Main");
  public readonly enabled = new Signal;

  private readonly damageDisplay = this.screen.DamageDisplay;
  private readonly stats = this.screen.Stats;
  private readonly hotbarButtons = getChildrenOfType<"ImageButton", HotbarButton>(this.screen.Hotbar, "ImageButton");
  private readonly damageTrash = new Trash;
  private hunger = 100;

  public constructor(
    private readonly replica: ReplicaController,
    private readonly character: CharacterController,
    private readonly tool: ToolController
  ) {
    messaging.client.on(Message.UpdateHunger, hunger => this.updateStats(this.hunger = hunger));
    messaging.client.on(Message.ShowDamageDisplay, humanoid => this.showDamageDisplay(humanoid));

    replica.updated.Connect(data => {
      this.updateHotbar(data.hotbar);
      this.updateStats();
    });
    for (const button of this.hotbarButtons)
      button.MouseButton1Click.Connect(() => {
        const itemID = button.GetAttribute<number>("CurrentItem")!;
        if (itemID === undefined) return;

        const tool = getItemByID<ToolItem>(itemID);
        if (!tool) return;

        this.tool.toggleEquipped(tool);
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
    if (!on) return;
    this.enabled.Fire();
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

    const { replica: { data }, stats } = this;
    const maxBagSpace = getBagSpace(data.equippedGear);
    const bagSpace = calculateBagSpace(data.hotbar, data.inventory);
    stats.BagSpace.Bar.Size = UDim2.fromScale(bagSpace / maxBagSpace, 1);
    stats.Hunger.Bar.Size = UDim2.fromScale(hunger / 100, 1);
    stats.Health.Bar.Size = UDim2.fromScale(humanoid.Health / humanoid.MaxHealth, 1);
  }

  private updateHotbar(hotbar: number[]): void {
    const buttons = this.hotbarButtons;
    let i = 0;

    for (const id of hotbar) {
      const button = buttons[i++];
      if (this.hasHotbarItem(button))
        this.removeHotbarItem(button);

      this.addHotbarItem(button, id);
    }
  }

  private addHotbarItem(hotbarButton: HotbarButton, id: number): void {
    (ViewportModel as { GenerateViewport: Callback }).GenerateViewport(hotbarButton.Viewport, getItemByID(id)?.Clone()); // DUM DUM HACK BC THIS MODULE IS TYPED INCORRECTLY
    hotbarButton.SetAttribute("CurrentItem", id);
  }

  private removeHotbarItem(hotbarButton: HotbarButton): void {
    (ViewportModel as { CleanViewport: Callback }).CleanViewport(hotbarButton.Viewport);
    hotbarButton.SetAttribute("CurrentItem", undefined);
  }

  private hasHotbarItem(hotbarButton: HotbarButton): boolean {
    return hotbarButton.GetAttribute("CurrentItem") !== undefined;
  }
}