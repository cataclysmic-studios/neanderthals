import { Controller, type OnTick } from "@flamework/core";
import { UserInputService, Workspace as World } from "@rbxts/services";
import { Trash } from "@rbxts/trash";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";

import type { CharacterController } from "./character";
import type { AnimationController } from "./animation";
import type { MainUIController } from "./ui/main";

const { delay } = task;

const SWING_COOLDOWN = 0.45;
const DAMAGE_DISPLAY_LIFETIME = 1;

@Controller()
export class MeleeController implements OnTick {
  private readonly toolTrash = new Trash;
  private readonly damageTrash = new Trash;
  private equippedTool?: ToolItem;
  private isSwinging = false;

  public constructor(
    private readonly character: CharacterController,
    private readonly animation: AnimationController,
    private readonly mainUI: MainUIController
  ) {
    messaging.client.on(Message.ShowDamageDisplay, humanoid => this.showDamageDisplay(humanoid));

    character.died.Connect(() => this.unequip());
    UserInputService.InputBegan.Connect((input) => {
      if (input.KeyCode !== Enum.KeyCode.One) return;
      if (this.hasEquipped())
        this.unequip();
      else
        this.equip(assets.Items["God Rock"]);
    });
  }

  private showDamageDisplay(humanoid: Humanoid) {
    this.damageTrash.purge();
    this.mainUI.enableDamageDisplay(humanoid);
    this.damageTrash.add(delay(DAMAGE_DISPLAY_LIFETIME, () => this.mainUI.disableDamageDisplay()));
  }

  public onTick(): void {
    if (!this.equippedTool) return;
    if (!this.isClickHeld()) return;
    this.swing();
  }

  public equip(tool: ToolItem): void {
    const character = this.character.get();
    if (!character)
      return warn("Failed to equip tool: no character");

    const { toolTrash } = this;
    const toEquip = toolTrash.add(tool.Clone());
    const handle = toEquip.Handle;
    const handWeld = toolTrash.add(handle.HandWeld);
    const hand = character.RightHand;
    handWeld.Parent = hand;
    handWeld.Part0 = hand;
    handWeld.Part1 = handle;
    toEquip.Parent = character;

    this.equippedTool = toEquip;
  }

  public unequip(): void {
    this.toolTrash.purge();
    this.equippedTool = undefined;
  }

  private hasEquipped(): boolean {
    return this.equippedTool !== undefined;
  }

  private swing(): void {
    if (this.isSwinging) return;
    this.isSwinging = true;

    this.animation.play(assets.Animations.Swing, { fadeTime: 0 });
    this.raycast();

    task.wait(SWING_COOLDOWN);
    this.isSwinging = false;
  }

  private raycast(): void {
    const character = this.character.get()!;
    const root = character.HumanoidRootPart;
    const raycastParams = new RaycastParams;
    raycastParams.AddToFilter(character);

    const tool = this.equippedTool!;
    const hitboxSize = tool.GetAttribute<Vector3>("HitboxSize") ?? vector.one;
    const rootCFrame = root.CFrame;
    const result = World.Blockcast(rootCFrame, hitboxSize, rootCFrame.LookVector, raycastParams);
    if (!result) return;

    const hitModel = result.Instance.FindFirstAncestorOfClass("Model");
    if (!hitModel) return;

    const humanoid = hitModel.FindFirstChildOfClass("Humanoid");
    if (!humanoid) return;

    messaging.server.emit(Message.Damage, {
      humanoid,
      toolName: tool.Name as never
    });
  }

  private isClickHeld(): boolean {
    return UserInputService.IsMouseButtonPressed(Enum.UserInputType.MouseButton1);
  }
}