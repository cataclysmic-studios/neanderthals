import { Controller, type OnStart } from "@flamework/core";
import { safeCast } from "@rbxts/flamework-meta-utils";
import { Trash } from "@rbxts/trash";

import { Message, messaging } from "shared/messaging";
import { weldTool } from "shared/utility";

@Controller()
export class ToolReplicationController implements OnStart {
  private readonly equippedToolTrash = new Map<Player, Trash>;

  public onStart(): void {
    messaging.client.on(Message.ReplicateEquipTool, ({ player, tool }) => this.equip(player, tool));
    messaging.client.on(Message.ReplicateUnequipTool, player => this.unequip(player));
  }

  public equip(player: Player, tool: ToolItem): void {
    const character = safeCast<CharacterModel>(player.Character);
    print(character)
    if (!character) return;

    const trash = new Trash;
    this.equippedToolTrash.set(player, trash);
    weldTool(tool, character, trash);
  }

  public unequip(player: Player): void {
    this.equippedToolTrash.get(player)?.destroy();
    this.equippedToolTrash.delete(player);
  }
}