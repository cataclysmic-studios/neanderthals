import { Controller } from "@flamework/core";
import type { Components } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";

import type { OnFixed } from "shared/hooks";
import { Message, messaging } from "shared/messaging";

import type { CreatureAnimator } from "client/components/replication/creature-animator";
import { assets } from "shared/constants";
import { P } from "ts-toolbelt/out/Object/_api";
import { CreatureSync } from "client/components/replication/creature-sync";

@Controller()
export class CreatureController implements OnFixed {
  public constructor(
    private readonly components: Components
  ) {
    World.CreatureServerStorage.Destroy();

    const storage = new Instance("Folder");
    storage.Name = "CreatureClientStorage";
    storage.Parent = World;

    messaging.client.on(Message.SpawnCreature, ({ id, name, position, health }) => {
      const creature = assets.Creatures[name].Clone();
      const humanoid = creature.Humanoid;
      creature.SetAttribute("ID", id);
      creature.PivotTo(new CFrame(position));
      humanoid.Health = health;
      humanoid.MaxHealth = health;
      creature.Parent = storage;
    });
    messaging.client.on(Message.UpdateCreatures, creatures => {
      const synchronizers = this.components.getAllComponents<CreatureSync>();
      for (const synchronizer of synchronizers) {
        const syncData = creatures.find(({ id }) => id === synchronizer.id);
        if (!syncData) continue;

        synchronizer.update(syncData.cframe);
      }
    });
  }

  public onFixed(): void {
    const animators = this.components.getAllComponents<CreatureAnimator>();
    for (const animator of animators)
      animator.tryIdle();
  }
}