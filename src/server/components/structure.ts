import type { OnStart } from "@flamework/core";
import { Component } from "@flamework/components";
import { Players, Workspace as World } from "@rbxts/services";
import { TweenBuilder } from "@rbxts/twin";
import { Trash } from "@rbxts/trash";
import { getDescendantsOfType } from "@rbxts/instance-utility";
import { $nameof } from "rbxts-transform-debug";

import { ToolKind } from "shared/structs/tool-kind";
import type { StructureConfig } from "shared/structs/structure-config";

import { CreatesDropsComponent } from "server/base-components/creates-drops";
import type { LevelsService } from "server/services/levels";

const DEFAULT_RESPAWN_TIME = 60;
const SHAKE_TWEEN_INFO = new TweenInfo(0.04, Enum.EasingStyle.Sine, Enum.EasingDirection.In, 0, true);
const SHAKE_MAGNITUDE = 0.2;
const SHAKE_LEFT_OFFSET = new Vector3(-SHAKE_MAGNITUDE, 0, -SHAKE_MAGNITUDE);
const SHAKE_RIGHT_OFFSET = new Vector3(SHAKE_MAGNITUDE, 0, SHAKE_MAGNITUDE);

interface PartInfo {
  readonly collisions: boolean;
  readonly transparency: number;
}

@Component({
  tag: $nameof<Structure>(),
  ancestorWhitelist: [World]
})
export class Structure extends CreatesDropsComponent<{}, StructureModel> implements OnStart {
  public readonly config = require<StructureConfig>(this.instance.Config);

  private readonly aliveTrash = new Trash;
  private readonly root = this.instance.PrimaryPart!;
  private shakeTween?: Tween;
  private parts = getDescendantsOfType(this.instance, "BasePart");
  private originalPartInfo = new Map<BasePart, PartInfo>;
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
    if (toolTier < minimumToolTier || (toolKind !== undefined && toolKind !== requiredToolKind)) {
      damage = 0;
      this.shake(); // dumbest hack lol
    }

    return damage;
  }

  private kill(): void {
    if (!this.alive) return;
    this.alive = false;
    this.aliveTrash.purge();
    this.shakeTween?.Destroy();
    this.shakeTween = undefined;

    const { drops, xp, noRespawn = false, respawnTime = DEFAULT_RESPAWN_TIME } = this.config;
    this.createDrops(drops);

    const killerID = this.instance.Humanoid.GetAttribute<number>("AttackerID");
    const killer = killerID !== undefined ? Players.GetPlayerByUserId(killerID) : undefined;
    if (killer !== undefined && xp !== undefined)
      this.levels.addXP(killer, xp);

    if (!noRespawn)
      this.toggleVisibility(false);
    else {
      this.parts = [];
      this.originalPartInfo = new Map;
      task.delay(0.25, () => {
        this.destroy();

        if (!this.instance) return;
        this.instance.Destroy();
      });
    }

    task.delay(respawnTime, () => this.spawn());
  }

  private spawn(resetState = true): void {
    if (this.alive) return;
    this.alive = true;

    const humanoid = this.instance.Humanoid;
    let lastHealth = humanoid.Health;
    this.aliveTrash.add(humanoid.GetPropertyChangedSignal("Health").Connect(() => {
      const health = humanoid.Health;
      if (health < lastHealth) {
        this.shake();
        lastHealth = health;
      }

      if (health > 0) return;
      this.kill();
    }));

    if (resetState) {
      this.toggleVisibility(true);
      humanoid.Health = humanoid.MaxHealth;
    }
  }

  private shake(): void {
    const origin = this.root.CFrame;
    this.shakeTween?.Destroy();
    this.shakeTween = TweenBuilder.forModel(this.instance)
      .info(SHAKE_TWEEN_INFO)
      .property("Value", origin.add(SHAKE_LEFT_OFFSET))
      .onCompleted(() => {
        this.shakeTween = TweenBuilder.forModel(this.instance)
          .info(SHAKE_TWEEN_INFO)
          .property("Value", origin.add(SHAKE_RIGHT_OFFSET))
          .onCompleted(() => this.shakeTween = undefined)
          .play();
      })
      .play();
  }

  private toggleVisibility(on: boolean): void {
    for (const part of this.parts) {
      const { collisions, transparency } = this.originalPartInfo.get(part)!
      part.Transparency = on ? transparency : 1;
      part.CanCollide = on ? collisions : false;
      part.CanQuery = on;
      part.CanTouch = on;

      for (const fx of getDescendantsOfType(part, "ParticleEmitter", "Light"))
        fx.Enabled = on;
    }
  }
}