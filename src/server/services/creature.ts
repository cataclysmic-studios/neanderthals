import { Service } from "@flamework/core";

@Service()
export class CreaturePathfindingService {
  public registerCreature(creature: CreatureServerModel, speed: number, size: Vector3): void {
    creature.SetAttribute("CreaturePathfinding_Speed", speed);
    creature.SetAttribute("CreaturePathfinding_Size", size);
    creature.AddTag("CreaturePathfinding");
  }
}