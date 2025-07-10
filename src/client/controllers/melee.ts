import { Controller, type OnTick } from "@flamework/core";
import { UserInputService, Workspace as World } from "@rbxts/services";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";

import type { CharacterController } from "./character";
import type { AnimationController } from "./animation";
import type { ToolController } from "./tool";

const { normalize, magnitude } = vector;

const SWING_COOLDOWN = 0.45;
const SWING_ANIMATION = assets.Animations.Swing;
const VISUALIZE_HITBOX = false;

@Controller()
export class MeleeController implements OnTick {
  private isSwinging = false;

  public constructor(
    private readonly character: CharacterController,
    private readonly animation: AnimationController,
    private readonly tool: ToolController
  ) { }

  public onTick(): void {
    if (!this.tool.hasEquipped()) return;
    if (!this.isClickHeld()) return;
    this.swing();
  }

  private swing(): void {
    if (this.isSwinging) return;
    this.isSwinging = true;

    this.animation.play(SWING_ANIMATION, { fadeTime: 0 });
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
    const direction = rootCFrame.LookVector;
    const distance = magnitude(direction);
    const origin = rootCFrame.add(direction.mul(distance / 2));
    if (VISUALIZE_HITBOX)
      visualizeHitbox(origin, direction, hitboxSize);

    const result = World.Blockcast(origin, hitboxSize, direction, raycastParams);
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

function visualizeHitbox(origin: CFrame, direction: Vector3, hitboxSize: Vector3): void {
  const distance = magnitude(direction);
  const castOffset = normalize(direction).mul(distance / 2);
  const castCenterCFrame = origin.mul(new CFrame(castOffset));
  const hitboxPart = new Instance("Part");
  hitboxPart.Size = hitboxSize.add(new Vector3(0, 0, distance));
  hitboxPart.CFrame = castCenterCFrame;
  hitboxPart.Anchored = true;
  hitboxPart.CanCollide = false;
  hitboxPart.Transparency = 0.5;
  hitboxPart.Color = Color3.fromRGB(255, 0, 0);
  hitboxPart.Material = Enum.Material.Neon;
  hitboxPart.Name = "HitboxCastPath";
  hitboxPart.Parent = game.Workspace;

  task.delay(0.15, () => hitboxPart.Destroy());
}
