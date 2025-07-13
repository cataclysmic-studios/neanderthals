import type { OnStart } from "@flamework/core";
import { Component } from "@flamework/components";
import { Trash } from "@rbxts/trash";
import { getDescendantsOfType } from "@rbxts/instance-utility";
import { $nameof } from "rbxts-transform-debug";

import type { StructureConfig } from "shared/structs/structure-config";

import { CreatesDropsComponent } from "server/base-components/creates-drops";
import { LevelsService } from "server/services/levels";
import { Players } from "@rbxts/services";
import { ToolKind } from "shared/structs/tool-kind";

const DEFAULT_RESPAWN_TIME = 60;

interface PartInfo {
  readonly collisions: boolean;
  readonly transparency: number;
}

@Component({
  tag: $nameof<Structure>()
})
export class Structure extends CreatesDropsComponent<{}, StructureModel> implements OnStart {
  public readonly config = require<StructureConfig>(this.instance.Config);

  private readonly aliveTrash = new Trash;
  private readonly parts = getDescendantsOfType(this.instance, "BasePart");
  private readonly originalPartInfo = new Map<BasePart, PartInfo>;
  private alive = false;

  public constructor(
    private readonly levels: LevelsService
  ) { super(); }

  public onStart(): void {
    for (const part of this.parts)
      this.originalPartInfo.set(part, {
        collisions: part.CanCollide,
        transparency: part.Transparency
      });

    this.spawn(false);
  }

  public getDamage(current: number, toolTier: number, toolKind: Maybe<ToolKind>): number {
    const { toolKind: requiredToolKind, minimumToolTier = 0 } = this.config;
    let damage = current;
    print(toolKind, requiredToolKind)
    if (toolKind !== undefined && toolKind !== requiredToolKind)
      damage /= 2;
    if (toolTier < minimumToolTier)
      damage = 0;

    return damage;
  }

  private kill(): void {
    if (!this.alive) return;
    this.alive = false;
    this.aliveTrash.purge();
    this.createDrops(this.config.drops);
    this.toggleVisibility(false);

    const killerID = this.instance.Humanoid.GetAttribute<number>("AttackerID");
    const killer = killerID !== undefined ? Players.GetPlayerByUserId(killerID) : undefined;
    if (killer !== undefined)
      this.levels.addXP(killer, this.config.xp);

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
      const { collisions, transparency } = this.originalPartInfo.get(part)!
      part.Transparency = on ? transparency : 1;
      part.CanCollide = on ? collisions : false;
      part.CanQuery = on;
      part.CanTouch = on;
    }
  }
}