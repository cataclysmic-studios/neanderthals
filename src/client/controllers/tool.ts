import { Controller } from "@flamework/core";
import { Trash } from "@rbxts/trash";

import { Message, messaging } from "shared/messaging";
import { DEFAULT_HITBOX_SIZE } from "shared/constants";
import { weldTool } from "shared/utility";

import type { CharacterController } from "./character";

@Controller()
export class ToolController {
  private readonly trash = new Trash;
  private equipped?: ToolItem;

  public constructor(
    private readonly character: CharacterController
  ) {
    character.died.Connect(() => this.unequip());
  }

  public toggleEquipped(tool: ToolItem): boolean {
    if (this.hasEquipped(tool)) {
      this.unequip();
      return false;
    }

    this.unequip();
    this.equip(tool);
    return true;
  }

  public equip(tool: ToolItem): void {
    const character = this.character.get();
    if (!character || !this.character.isAlive())
      return warn("Failed to equip tool: no character");

    this.equipped = weldTool(tool, character, this.trash);
    messaging.server.emit(Message.EquipTool, tool);
  }

  public unequip(): void {
    this.trash.purge();
    this.equipped = undefined;
    messaging.server.emit(Message.UnequipTool);
  }

  public getHitboxSize(): Vector3 {
    return this.equipped!.GetAttribute<Vector3>("HitboxSize") ?? DEFAULT_HITBOX_SIZE;
  }

  public getID(): number {
    return this.equipped!.GetAttribute<number>("ID")!;
  }

  public hasEquipped(tool?: ToolItem): boolean {
    return tool
      ? this.equipped !== undefined && this.getID() === tool.GetAttribute("ID")
      : this.equipped !== undefined;
  }
}