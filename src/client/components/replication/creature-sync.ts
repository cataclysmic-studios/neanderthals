import type { OnTick } from "@flamework/core";
import { Component, type Components } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";
import { getDescendantsOfType } from "@rbxts/instance-utility";
import { $nameof } from "rbxts-transform-debug";

import { player } from "client/constants";
import SmoothValue from "shared/classes/smooth-value";

import DestroyableComponent from "shared/base-components/destroyable";
import { CreatureAnimator } from "./creature-animator";

const { clamp } = math;

const INTERPOLATION_DELAY = 0.2;
const MAX_EXTRAPOLATION_TIME = 0.5;
const SNAPSHOT_LIFETIME = 2;

interface Snapshot {
  readonly time: number;
  readonly cframe: CFrame;
}

@Component({ tag: $nameof<CreatureSync>() })
export class CreatureSync extends DestroyableComponent<{ ID: number }, CreatureModel> implements OnTick {
  public readonly id = this.attributes.ID;
  public readonly root = this.instance.PrimaryPart!;
  public cframe = this.root.CFrame;

  private readonly animator: CreatureAnimator;
  private timeOffset = new SmoothValue(4);
  private snapshotBuffer: Snapshot[] = [];
  private latestCFrame = this.cframe;
  private timeNow = 0;

  public constructor(components: Components) {
    super();
    this.animator = components.getComponent(this.instance)!;
    for (const part of getDescendantsOfType(this.instance, "BasePart"))
      part.Anchored = false;

    this.trash.linkToInstance(this.instance);
    this.trash.add(() => {
      this.snapshotBuffer = undefined!;
      this.timeOffset = undefined!;
    });
  }

  public onTick(dt: number): void {
    this.updateTimeNow(dt);

    const { animator } = this;
    const cframe = this.getLerpedCFrame(World.GetServerTimeNow() - INTERPOLATION_DELAY);
    const lastCFrame = this.cframe;
    this.cframe = cframe; // update cframe asap
    this.root.AssemblyLinearVelocity = vector.zero;
    this.root.AssemblyAngularVelocity = vector.zero;

    const moving = !lastCFrame.FuzzyEq(cframe);
    const isWalkAnimationPlaying = animator.isWalking();
    if (moving && !isWalkAnimationPlaying)
      animator.startWalk();
    else if (!moving && isWalkAnimationPlaying)
      animator.stopWalk();
  }

  public update(cframe: CFrame): void {
    this.addSnapshot(cframe);
    this.latestCFrame = cframe;
  }

  private addSnapshot(cframe: CFrame): void {
    const buffer = this.snapshotBuffer;
    const time = this.timeNow;
    const snapshot: Snapshot = { time, cframe };
    const minTime = time - SNAPSHOT_LIFETIME;
    buffer.push(snapshot);

    let first: Maybe<Snapshot>;
    while (
      (first = buffer.first()) !== undefined
      && buffer.size() > 1
      && first.time < minTime
    ) {
      buffer.shift();
    }
  }

  private updateTimeNow(dt: number): number {
    const { timeOffset } = this;
    const ping = player.GetNetworkPing();
    timeOffset.setTarget((ping + dt + 1 / 59) / 2);
    return this.timeNow = World.GetServerTimeNow() + timeOffset.update(dt);
  }

  private getLerpedCFrame(time: number): CFrame {
    const buffer = this.snapshotBuffer;
    const size = buffer.size();

    if (size < 2)
      return this.latestCFrame; // not enough data

    const first = buffer.first()!;
    if (time <= first.time)
      return first.cframe;

    for (let i = 0; i < size - 1; i++) {
      const older = buffer[i];
      const newer = buffer[i + 1];
      const olderTime = older.time;
      const newerTime = newer.time;

      if (time >= olderTime && time <= newerTime) {
        const alpha = (time - olderTime) / (newerTime - olderTime);
        return older.cframe.Lerp(newer.cframe, alpha);
      }
    }

    // extrapolation
    const last = buffer[size - 1];
    const secondLast = buffer[size - 2];
    const lastCFrame = last.cframe;
    const lastTime = last.time;
    const timeDifference = lastTime - secondLast.time;
    if (timeDifference <= 0)
      return lastCFrame;

    const lastPosition = lastCFrame.Position;
    const velocity = lastPosition
      .sub(secondLast.cframe.Position)
      .div(timeDifference);

    const overshoot = time - lastTime;
    const extrapolationT = clamp(overshoot, 0, MAX_EXTRAPOLATION_TIME);
    const newPosition = lastPosition.add(velocity.mul(extrapolationT));
    return new CFrame(newPosition, newPosition.add(lastCFrame.LookVector));
  }
}