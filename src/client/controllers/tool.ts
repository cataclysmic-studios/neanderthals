import { Controller } from "@flamework/core";
import { UserInputService } from "@rbxts/services";
import { Trash } from "@rbxts/trash";

import { assets } from "shared/constants";

import type { CharacterController } from "./character";

@Controller()
export class ToolController {
  private readonly trash = new Trash;
  private equipped?: ToolItem;

  public constructor(
    private readonly character: CharacterController
  ) {
    character.died.Connect(() => this.unequip());

    // temporary
    UserInputService.InputBegan.Connect(input => {
      if (input.KeyCode !== Enum.KeyCode.One) return;
      if (this.hasEquipped())
        this.unequip();
      else
        this.equip(assets.Items["God Rock"]);
    });
  }

  public equip(tool: ToolItem): void {
    const character = this.character.get();
    if (!character)
      return warn("Failed to equip tool: no character");

    const { trash } = this;
    const toEquip = trash.add(tool.Clone());
    const handle = toEquip.Handle;
    const handWeld = trash.add(handle.HandWeld);
    const hand = character.RightHand;
    handWeld.Parent = hand;
    handWeld.Part0 = hand;
    handWeld.Part1 = handle;
    toEquip.Parent = character;

    this.equipped = toEquip;
  }

  public unequip(): void {
    this.trash.purge();
    this.equipped = undefined;
  }

  public getHitboxSize(): Vector3 {
    return this.equipped!.GetAttribute<Vector3>("HitboxSize") ?? vector.one;
  }

  public getName(): ToolName {
    return this.equipped!.Name as never;
  }

  public hasEquipped(): boolean {
    return this.equipped !== undefined;
  }
}