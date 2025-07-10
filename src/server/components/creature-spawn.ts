import type { OnStart } from "@flamework/core";
import { Component, BaseComponent } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";
import { $nameof } from "rbxts-transform-debug";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import { OnPlayerAdd } from "server/hooks";

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
export class CreatureSpawn extends BaseComponent<Attributes, BasePart> implements OnStart, OnPlayerAdd {
  private readonly name = this.instance.Name as CreatureName;
  private readonly template = assets.Creatures[this.name];
  private readonly spawnRate = this.attributes.CreatureSpawn_Rate;
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

    // hydrate creature
    task.wait(0.5);
    messaging.client.emit(player, Message.SpawnCreature, {
      name: this.name,
      id: this.creature.GetAttribute<number>("ID")!,
      position: this.creature.GetPivot().Position,
      health: this.creature.Humanoid.Health
    });
  }

  private spawn(): void {
    if (this.creature) return;

    const creature = assets.CreatureServerModel.Clone();
    const humanoid = new Instance("Humanoid");
    const maxHealth = this.template.Humanoid.MaxHealth;
    humanoid.MaxHealth = maxHealth;
    humanoid.Health = maxHealth;
    humanoid.Died.Once(() => this.onDied());
    humanoid.Parent = creature;

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
    cumulativeCreatureID--;
  }

  private getSpawnCFrame(): CFrame {
    const creatureOffset = this.creatureSize.Y / 2;
    const spawnOffset = -this.instance.Size.Y / 2;

    return this.instance.CFrame
      .add(Vector3.yAxis.mul(creatureOffset + spawnOffset));
  }
}