import { Controller, type OnTick } from "@flamework/core";
import { UserInputService, Workspace as World } from "@rbxts/services";
import { Trash } from "@rbxts/trash";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";

import type { CharacterController } from "./character";
import type { AnimationController } from "./animation";
import type { MainUIController } from "./ui/main";
import { ToolController } from "./tool";

const { delay } = task;

const SWING_COOLDOWN = 0.45;
const DAMAGE_DISPLAY_LIFETIME = 1;

@Controller()
export class MeleeController implements OnTick {
  private readonly damageTrash = new Trash;
  private isSwinging = false;

  public constructor(
    private readonly character: CharacterController,
    private readonly animation: AnimationController,
    private readonly tool: ToolController,
    private readonly mainUI: MainUIController
  ) {
    messaging.client.on(Message.ShowDamageDisplay, humanoid => this.showDamageDisplay(humanoid));
  }

  private showDamageDisplay(humanoid: Humanoid) {
    this.damageTrash.purge();
    this.mainUI.enableDamageDisplay(humanoid);
    this.damageTrash.add(delay(DAMAGE_DISPLAY_LIFETIME, () => this.mainUI.disableDamageDisplay()));
  }

  public onTick(): void {
    if (!this.tool.hasEquipped()) return;
    if (!this.isClickHeld()) return;
    this.swing();
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

    const hitboxSize = this.tool.getHitboxSize();
    const rootCFrame = root.CFrame;
    const result = World.Blockcast(rootCFrame, hitboxSize, rootCFrame.LookVector, raycastParams);
    if (!result) return;

    const hitModel = result.Instance.FindFirstAncestorOfClass("Model");
    if (!hitModel) return;

    const humanoid = hitModel.FindFirstChildOfClass("Humanoid");
    if (!humanoid) return;

    const toolName = this.tool.getName();
    messaging.server.emit(Message.Damage, { humanoid, toolName });
  }

  private isClickHeld(): boolean {
    return UserInputService.IsMouseButtonPressed(Enum.UserInputType.MouseButton1);
  }
}