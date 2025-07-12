import { Service } from "@flamework/core";
import type { Components } from "@flamework/components";

import { FixedUpdateRate, type OnFixed } from "shared/hooks";
import { Message, messaging } from "shared/messaging";
import { CREATURE_UPDATE_RATE } from "shared/constants";
import type { CreatureUpdatePacket } from "shared/structs/packets";

import type { CreaturePathfinding } from "server/components/creature-pathfinding";

@Service()
@FixedUpdateRate(CREATURE_UPDATE_RATE)
export class CreaturePathfindingService implements OnFixed {
  public constructor(
    private readonly components: Components
  ) { }

  public onFixed(): void {
    const creatures = this.components.getAllComponents<CreaturePathfinding>();
    const packet: CreatureUpdatePacket = [];
    for (const creature of creatures)
      packet.push({
        id: creature.id,
        cframe: creature.cframe
      });

    messaging.client.emitAll(Message.UpdateCreatures, packet);
  }

  public registerCreature(creature: CreatureServerModel, speed: number, size: Vector3): void {
    creature.SetAttribute("CreaturePathfinding_Speed", speed);
    creature.SetAttribute("CreaturePathfinding_Size", size);
    creature.AddTag("CreaturePathfinding");
  }
}