import { Controller } from "@flamework/core";
import type { Components } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";

import type { OnFixed } from "shared/hooks";
import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import { findClientCreatureByID } from "shared/utility";
import type { CreatureSpawnPacket, CreatureUpdatePacket } from "shared/structs/packets";

import type { CreatureAnimator } from "client/components/replication/creature-animator";
import type { CreatureSync } from "client/components/replication/creature-sync";
import type { MainUIController } from "../ui/main";

const storage = new Instance("Folder");
storage.Name = "CreatureClientStorage";
storage.Parent = World;

function spawn({ name, id, position, health }: CreatureSpawnPacket): void {
  const creature = assets.Creatures[name].Clone();
  const humanoid = creature.Humanoid;
  creature.SetAttribute("ID", id);
  creature.PivotTo(new CFrame(position));
  humanoid.Health = health;
  humanoid.MaxHealth = health;
  creature.Parent = storage;
  creature.AddTag("CreatureAnimator");
  creature.AddTag("CreatureSync");
}

@Controller({ loadOrder: 0 })
export class CreatureController implements OnFixed {
  public constructor(
    private readonly components: Components,
    private readonly mainUI: MainUIController
  ) {
    messaging.client.on(Message.SpawnCreature, spawn);
    messaging.client.on(Message.CreatureHealthChange, ({ id, health }) => this.onHealthChanged(id, health));
    messaging.client.on(Message.UpdateCreatures, creatures => this.update(creatures));
    World.CreatureServerStorage.Destroy();
  }

  public onFixed(): void {
    const animators = this.components.getAllComponents<CreatureAnimator>();
    for (const animator of animators)
      animator.tryIdle();
  }

  private onHealthChanged(id: number, newHealth: number): void {
    const creature = findClientCreatureByID(id);
    if (!creature) return;

    const humanoid = creature.Humanoid;
    humanoid.Health = newHealth;
    this.mainUI.showDamageDisplay(creature.Name, newHealth, humanoid.MaxHealth);

    if (newHealth > 0) return;
    this.despawn(id);
  }

  private despawn(id: number): void {
    const synchronizer = this.getSync(id);
    if (!synchronizer) return;

    const animator = this.components.getComponent<CreatureAnimator>(synchronizer.instance);
    synchronizer.destroy();
    animator?.destroy();
  }

  private update(creatures: CreatureUpdatePacket): void {
    const synchronizers = this.components.getAllComponents<CreatureSync>();
    for (const synchronizer of synchronizers) {
      const syncData = creatures.find(({ id }) => id === synchronizer.id);
      if (!syncData) continue;

      synchronizer.update(syncData.cframe);
    }
  }

  private getSync(id: number): Maybe<CreatureSync> {
    return this.components.getAllComponents<CreatureSync>()
      .find(sync => sync.id === id);
  }
}