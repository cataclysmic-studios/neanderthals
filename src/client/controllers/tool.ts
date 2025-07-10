import { Controller } from "@flamework/core";
import { UserInputService } from "@rbxts/services";
import { Trash } from "@rbxts/trash";

import { Message, messaging } from "shared/messaging";
import { getItemByID, weldTool } from "shared/utility";
import { TOOL_IDS } from "shared/structs/item-id";

import type { CharacterController } from "./character";
import type { ReplicaController } from "./replica";

@Controller()
export class ToolController {
  private readonly trash = new Trash;
  private equipped?: ToolItem;

  public constructor(
    private readonly character: CharacterController,
    private readonly replica: ReplicaController
  ) {
    character.died.Connect(() => this.unequip());

    // temporary
    UserInputService.InputBegan.Connect(input => {
      if (input.KeyCode !== Enum.KeyCode.One) return;
      if (this.hasEquipped())
        this.unequip();
      else
        this.equip(this.getTools().first()!); // TODO: hotbar
    });
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

  public hasEquipped(): boolean {
    return this.equipped !== undefined;
  }

  private getTools(): ToolItem[] {
    return [...this.replica.data.inventory]
      .map(([id]) => id)
      .filter(id => TOOL_IDS.has(id))
      .mapFiltered(getItemByID<ToolItem>);
  }
}