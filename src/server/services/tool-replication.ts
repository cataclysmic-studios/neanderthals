import { Service, type OnStart } from "@flamework/core";
import { Message, messaging } from "shared/messaging";

@Service()
export class ToolReplicationService implements OnStart {
  public onStart(): void {
    messaging.server.on(Message.EquipTool, (player, tool) =>
      messaging.client.emitExcept(player, Message.ReplicateEquipTool, { player, tool })
    );
    messaging.server.on(Message.UnequipTool, (player, tool) =>
      messaging.client.emitExcept(player, Message.ReplicateUnequipTool, player)
    );
  }
}