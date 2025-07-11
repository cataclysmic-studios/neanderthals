import { Controller } from "@flamework/core";
import { Trash } from "@rbxts/trash";

import { Message, messaging } from "shared/messaging";
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

  public toggleEquipped(tool: ToolItem): void {
    if (this.hasEquipped(tool))
      return this.unequip();

    this.unequip();
    this.equip(tool);
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
    return this.equipped!.GetAttribute<Vector3>("HitboxSize") ?? vector.one;
  }

  public getName(): ToolName {
    return this.equipped!.Name as never;
  }

  public hasEquipped(tool?: ToolItem): boolean {
    return tool
      ? this.equipped !== undefined && this.equipped.GetAttribute("ID") === tool.GetAttribute("ID")
      : this.equipped !== undefined;
  }
}