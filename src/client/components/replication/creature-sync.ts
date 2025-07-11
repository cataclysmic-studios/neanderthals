import { Component } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";
import { player } from "client/constants";
import { $nameof } from "rbxts-transform-debug";
import DestroyableComponent from "shared/base-components/destroyable";
import SmoothValue from "shared/classes/smooth-value";

import type { OnFixed } from "shared/hooks";

const { clamp } = math;

const INTERPOLATION_DELAY = 0.2;
const MAX_EXTRAPOLATION_TIME = 0.5;
const SNAPSHOT_LIFETIME = 2;

interface Snapshot {
  readonly time: number;
  readonly cframe: CFrame;
}

@Component({ tag: $nameof<CreatureSync>() })
export class CreatureSync extends DestroyableComponent<{ ID: number }, CreatureModel> implements OnFixed {
  public readonly id = this.attributes.ID;

  private readonly root = this.instance.PrimaryPart!;
  private timeOffset = new SmoothValue(4);
  private snapshotBuffer: Snapshot[] = [];
  private rootCFrame = this.root.CFrame;
  private latestCFrame = this.rootCFrame;
  private timeNow = 0;

  public constructor() {
    super();
    this.trash.linkToInstance(this.instance);
    this.trash.add(() => {
      this.snapshotBuffer = undefined!;
      this.timeOffset = undefined!;
    });
  }

  public onFixed(dt: number): void {
    const timeNow = this.updateTimeNow(dt);
    this.rootCFrame = this.getLerpedCFrame(timeNow - INTERPOLATION_DELAY);
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
    const lastCFrameLookVector = lastCFrame.LookVector;
    return new CFrame(newPosition, newPosition.add(lastCFrameLookVector));
  }
}