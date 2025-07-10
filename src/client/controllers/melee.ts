import { Controller, type OnTick } from "@flamework/core";
import { UserInputService } from "@rbxts/services";
import { Trash } from "@rbxts/trash";

import { assets } from "shared/constants";

import type { CharacterController } from "./character";
import type { AnimationController } from "./animation";

const SWING_COOLDOWN = 0.8;

@Controller()
export class MeleeController implements OnTick {
  private readonly toolTrash = new Trash;
  private equippedTool?: ToolItem;
  private isSwinging = false;

  public constructor(
    private readonly character: CharacterController,
    private readonly animation: AnimationController
  ) {
    UserInputService.InputBegan.Connect((input) => {
      if (input.KeyCode !== Enum.KeyCode.One) return;
      if (this.hasEquipped())
        this.unequip();
      else
        this.equip(assets.Items.Rock);
    });
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

    task.wait(SWING_COOLDOWN);
    this.isSwinging = false;
  }

  private isClickHeld(): boolean {
    return UserInputService.IsMouseButtonPressed(Enum.UserInputType.MouseButton1);
  }
}