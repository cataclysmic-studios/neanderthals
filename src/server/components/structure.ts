import type { OnStart } from "@flamework/core";
import { Component } from "@flamework/components";
import { Trash } from "@rbxts/trash";
import { getDescendantsOfType } from "@rbxts/instance-utility";
import { $nameof } from "rbxts-transform-debug";

import type { StructureConfig } from "shared/structs/structure-config";

import { CreatesDropsComponent } from "server/base-components/creates-drops";

const DEFAULT_RESPAWN_TIME = 60;

@Component({
  tag: $nameof<Structure>()
})
export class Structure extends CreatesDropsComponent<{}, StructureModel> implements OnStart {
  public readonly config = require<StructureConfig>(this.instance.Config);

  private readonly aliveTrash = new Trash;
  private readonly parts = getDescendantsOfType(this.instance, "BasePart");
  private readonly originalCollisions = new Map<BasePart, boolean>;
  private alive = false;

  public onStart(): void {
    for (const part of this.parts)
      this.originalCollisions.set(part, part.CanCollide);

    this.spawn(false);
  }

  private kill(): void {
    if (!this.alive) return;
    this.alive = false;
    this.aliveTrash.purge();
    this.createDrops(this.config.drops);
    this.toggleVisibility(false);

    const { noRespawn = false, respawnTime = DEFAULT_RESPAWN_TIME } = this.config;
    if (noRespawn) return;

    task.delay(respawnTime, () => this.spawn());
  }

  private spawn(resetState = true): void {
    if (this.alive) return;
    this.alive = true;

    const humanoid = this.instance.Humanoid;
    this.aliveTrash.add(humanoid.GetPropertyChangedSignal("Health").Connect(() => {
      if (humanoid.Health > 0) return;
      this.kill();
    }));

    if (resetState) {
      this.toggleVisibility(true);
      humanoid.Health = humanoid.MaxHealth;
    }
  }

  private toggleVisibility(on: boolean): void {
    for (const part of this.parts) {
      part.Transparency = on ? 0 : 1;
      part.CanCollide = on ? this.originalCollisions.get(part)! : false;
      part.CanQuery = on;
      part.CanTouch = on;
    }
  }
}