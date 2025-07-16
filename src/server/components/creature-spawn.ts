import type { OnStart } from "@flamework/core";
import { Component } from "@flamework/components";
import { Players, Workspace as World } from "@rbxts/services";
import { $nameof } from "rbxts-transform-debug";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import type { CreatureConfig } from "shared/structs/creature-config";

import { CreatesDropsComponent } from "server/base-components/creates-drops";
import type { CreaturePathfindingService } from "server/services/creature";
import type { CharacterService } from "server/services/character";
import type { LevelsService } from "server/services/levels";

interface Attributes {
  readonly CreatureSpawn_Rate: number;
}

let cumulativeCreatureID = 0;

@Component({
  tag: $nameof<CreatureSpawn>(),
  defaults: {
    CreatureSpawn_Rate: 60
  }
})
export class CreatureSpawn extends CreatesDropsComponent<Attributes, BasePart> implements OnStart {
  private readonly name = this.instance.Name as CreatureName;
  private readonly template = assets.Creatures[this.name];
  private readonly spawnRate = this.attributes.CreatureSpawn_Rate;
  private readonly config = require<CreatureConfig>(this.template.Config);
  private readonly creatureSize: Vector3;

  private creature?: CreatureServerModel;

  public constructor(
    private readonly pathfinding: CreaturePathfindingService,
    private readonly character: CharacterService,
    private readonly levels: LevelsService
  ) {
    super();

    const [_, size] = this.template.GetBoundingBox();
    this.creatureSize = size;
  }

  public onStart(): void {
    messaging.server.on(Message.InitializeData, player => this.hydrate(player));
    this.spawn();
  }

  private hydrate(player: Player): void {
    const { creature } = this;
    if (!creature) return;

    messaging.client.emit(player, Message.SpawnCreature, {
      name: this.name,
      id: creature.GetAttribute<number>("ID")!,
      position: creature.GetPivot().Position,
      health: creature.Humanoid.Health
    });
  }

  private spawn(): void {
    if (this.creature) return;

    const creature = assets.CreatureServerModel.Clone();
    const humanoid = creature.Humanoid;
    const templateHumanoid = this.template.Humanoid;
    const maxHealth = templateHumanoid.MaxHealth;
    humanoid.MaxHealth = maxHealth;
    humanoid.Health = maxHealth;
    humanoid.GetPropertyChangedSignal("Health").Connect(() => {
      if (humanoid.Health > 0) return;

      const attackerID = humanoid.GetAttribute<number>("AttackerID");
      if (attackerID === undefined) return;

      const attacker = Players.GetPlayerByUserId(attackerID);
      if (!attacker) return;

      this.despawn(attacker);
    });

    const id = cumulativeCreatureID++;
    const cframe = this.getSpawnCFrame();
    creature.Name = this.name + "-" + id;
    creature.SetAttribute("ID", id);
    creature.PivotTo(cframe);
    creature.Parent = World.CreatureServerStorage;
    messaging.client.emitAll(Message.SpawnCreature, {
      name: this.name,
      id,
      position: cframe.Position,
      health: maxHealth
    });

    const speed = templateHumanoid.WalkSpeed;
    this.creature = creature;
    this.pathfinding.registerCreature(creature, speed, this.creatureSize);
  }

  private despawn(killer: Player): void {
    task.delay(this.spawnRate, () => this.spawn());

    const { creature, config } = this;
    if (creature) {
      this.levels.addXP(killer, config.xp);
      this.createDrops(config.drops, creature.PrimaryPart!.CFrame);
      creature.Destroy();
      this.creature = undefined;
    }

    cumulativeCreatureID--;
  }

  private getSpawnCFrame(): CFrame {
    const creatureOffset = this.creatureSize.Y / 2;
    const spawnOffset = -this.instance.Size.Y / 2;

    return this.instance.CFrame
      .add(Vector3.yAxis.mul(creatureOffset + spawnOffset + 1));
  }
}