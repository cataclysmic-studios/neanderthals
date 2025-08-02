import { Service, type OnStart } from "@flamework/core";

import { Message, messaging } from "shared/messaging";
import { getItemByID } from "shared/utility/items";

import type { DataService } from "./data";

@Service()
export class ToolReplicationService implements OnStart {
  public constructor(
    private readonly data: DataService
  ) { }

  public onStart(): void {
    messaging.server.on(Message.EquipTool, async (player, slot) => {
      const data = await this.data.get(player);
      const toolID = data.hotbar.get(slot);
      if (toolID === undefined) return;

      const tool = getItemByID<ToolItem>(toolID);
      messaging.client.emitExcept(player, Message.ReplicateEquipTool, { player, tool });
    });
    messaging.server.on(Message.UnequipTool, player =>
      messaging.client.emitExcept(player, Message.ReplicateUnequipTool, player)
    );
  }
}