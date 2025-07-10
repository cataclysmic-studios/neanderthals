import type { OnStart } from "@flamework/core";
import { Component, BaseComponent } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";
import { $nameof } from "rbxts-transform-debug";

import type { OnPlayerAdd } from "server/hooks";
import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import { dropItem } from "shared/utility";
import type { CreatureConfig } from "shared/structs/creature-config";
import { CreatesDropsComponent } from "server/base-components/creates-drops";

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
export class CreatureSpawn extends CreatesDropsComponent<Attributes, BasePart> implements OnStart, OnPlayerAdd {
  private readonly name = this.instance.Name as CreatureName;
  private readonly template = assets.Creatures[this.name];
  private readonly spawnRate = this.attributes.CreatureSpawn_Rate;
  private readonly config = require(this.template.Config) as CreatureConfig;
  private readonly creatureSize: Vector3;

  private creature?: CreatureServerModel;

  public constructor() {
    super();

    const [_, size] = this.template.GetBoundingBox();
    this.creatureSize = size;
  }

  public onStart(): void {
    this.spawn();
  }

  public onPlayerAdd(player: Player): void {
    if (!this.creature) return;
    if (!player.Character)
      player.CharacterAdded.Wait();

    this.hydrate(player);
  }

  private hydrate(player: Player): void {
    const creature = this.creature!;
    task.wait(0.5);
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
    const maxHealth = this.template.Humanoid.MaxHealth;
    humanoid.MaxHealth = maxHealth;
    humanoid.Health = maxHealth;
    humanoid.GetPropertyChangedSignal("Health").Connect(() => {
      if (humanoid.Health > 0) return;
      this.onDied();
    });

    const cframe = this.getSpawnCFrame();
    const id = cumulativeCreatureID++;
    creature.Name = [this.name, "-", id].join("");
    creature.SetAttribute("ID", id);
    creature.PivotTo(cframe);
    creature.Parent = World.CreatureServerStorage;
    messaging.client.emitAll(Message.SpawnCreature, {
      name: this.name,
      id,
      position: cframe.Position,
      health: maxHealth
    });

    this.creature = creature;
  }

  private onDied(): void {
    task.delay(this.spawnRate, () => this.spawn());
    this.createDrops(this.config.drops);
    this.creature?.Destroy();
    this.creature = undefined;
    cumulativeCreatureID--;
  }

  private getSpawnCFrame(): CFrame {
    const creatureOffset = this.creatureSize.Y / 2;
    const spawnOffset = -this.instance.Size.Y / 2;

    return this.instance.CFrame
      .add(Vector3.yAxis.mul(creatureOffset + spawnOffset + 1));
  }
}