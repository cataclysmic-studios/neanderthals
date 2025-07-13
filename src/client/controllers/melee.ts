import { Controller } from "@flamework/core";
import { UserInputService, Workspace as World } from "@rbxts/services";

import type { OnFixed } from "shared/hooks";
import { assets } from "shared/constants";

import type { CharacterController } from "./character";
import type { AnimationController } from "./animation";
import type { ToolController } from "./tool";
import type { DamageController } from "./damage";

const SWING_COOLDOWN = 0.45;
const SWING_ANIMATION = assets.Animations.Swing;
const VISUALIZE_HITBOX = false;

function visualizeHitbox(origin: CFrame, direction: Vector3, hitboxSize: Vector3): void {
  const castCenterCFrame = origin.add(direction);
  const hitboxPart = new Instance("Part");
  hitboxPart.Size = hitboxSize;
  hitboxPart.CFrame = castCenterCFrame;
  hitboxPart.Anchored = true;
  hitboxPart.CanCollide = false;
  hitboxPart.Transparency = 0.5;
  hitboxPart.Color = Color3.fromRGB(255, 0, 0);
  hitboxPart.Material = Enum.Material.Neon;
  hitboxPart.Name = "HitboxCast";
  hitboxPart.Parent = game.Workspace;

  task.delay(0.15, () => hitboxPart.Destroy());
}

@Controller()
export class MeleeController implements OnFixed {
  private isSwinging = false;

  public constructor(
    private readonly character: CharacterController,
    private readonly animation: AnimationController,
    private readonly tool: ToolController,
    private readonly damage: DamageController
  ) { }

  public onFixed(): void {
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
    raycastParams.FilterType = Enum.RaycastFilterType.Exclude;

    const hitboxSize = this.tool.getHitboxSize();
    const rootCFrame = root.CFrame;
    const distance = hitboxSize.Z;
    const look = rootCFrame.LookVector;
    const direction = look.mul(distance);
    const origin = rootCFrame.sub(look.mul(distance / 4));
    if (VISUALIZE_HITBOX)
      visualizeHitbox(origin, direction, hitboxSize);

    const result = World.Blockcast(origin, hitboxSize, direction, raycastParams);
    if (!result) return;

    const hitModel = result.Instance.FindFirstAncestorOfClass("Model");
    if (!hitModel) return;

    this.damage.deal(hitModel);
  }

  private isClickHeld(): boolean {
    return UserInputService.IsMouseButtonPressed(Enum.UserInputType.MouseButton1);
  }
}