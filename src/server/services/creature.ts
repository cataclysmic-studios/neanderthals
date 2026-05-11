import { Service } from "@flamework/core";
import type { Components } from "@flamework/components";

import { FixedUpdateRate, type OnFixed } from "shared/hooks";
import { Message, messaging } from "shared/messaging";
import { CREATURE_UPDATE_RATE } from "shared/constants";

import type { CreaturePathfinding } from "server/components/creature-pathfinding";

@Service()
@FixedUpdateRate(CREATURE_UPDATE_RATE)
export class CreaturePathfindingService implements OnFixed {
  public constructor(
    private readonly components: Components
  ) { }

  public onFixed(): void {
    const creatures = this.components.getAllComponents<CreaturePathfinding>();
    if (creatures.isEmpty()) return;
    messaging.client.emitAll(Message.UpdateCreatures, creatures);
  }

  public registerCreature(creature: CreatureServerModel, speed: number, size: Vector3): void {
    creature.SetAttribute("CreaturePathfinding_Speed", speed);
    creature.SetAttribute("CreaturePathfinding_Size", size);
    creature.AddTag("CreaturePathfinding");
  }
}