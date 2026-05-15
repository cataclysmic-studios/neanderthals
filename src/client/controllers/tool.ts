import { Controller } from "@flamework/core";
import { Trash } from "@rbxts/trash";

import { Message, messaging } from "shared/messaging";
import { weldTool } from "shared/utility";
import { DEFAULT_HITBOX_SIZE } from "shared/constants";
import type { ItemID } from "shared/item-id";

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

  public toggleEquipped(tool: ToolItem, slot: HotbarKeyName): boolean {
    if (this.hasEquipped(tool)) {
      this.unequip();
      return false;
    }

    this.unequip();
    return this.equip(tool, slot);
  }

  public equip(tool: ToolItem, slot: HotbarKeyName): boolean {
    const character = this.character.get();
    if (!character || !this.character.isAlive()) {
      warn("Failed to equip tool: no character");
      return false;
    }

    this.equipped = weldTool(tool, character, this.trash);
    messaging.server.emit(Message.EquipTool, slot);
    return true;
  }

  public unequip(): void {
    this.trash.purge();

    if (!this.equipped) return;
    delete this.equipped;
    messaging.server.emit(Message.UnequipTool);
  }

  public getHitboxSize(): Vector3 {
    return this.equipped!.GetAttribute<Vector3>("HitboxSize") ?? DEFAULT_HITBOX_SIZE;
  }

  public getID(): ItemID {
    return this.equipped!.GetAttribute<ItemID>("ID")!;
  }

  public hasEquipped(tool?: ToolItem): boolean {
    return tool
      ? this.equipped !== undefined && this.getID() === tool.GetAttribute("ID")
      : this.equipped !== undefined;
  }
}