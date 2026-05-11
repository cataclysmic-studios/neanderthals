import type { OnTick } from "@flamework/core";
import { Component } from "@flamework/components";
import { $nameof } from "rbxts-transform-debug";

import DestroyableComponent from "shared/base-components/destroyable";

const SPEED = 10;

interface BoatModel extends Model {
  DriverSeat: Seat;
}

@Component({ tag: $nameof<Boat>() })
export class Boat extends DestroyableComponent<{}, BoatModel> implements OnTick {
  private readonly root = this.instance.PrimaryPart!;

  public onTick(dt: number): void {
    const driver = this.instance.DriverSeat.Occupant;
    if (!driver) return;

    const direction = driver.MoveDirection;
    if (direction.FuzzyEq(Vector3.zero)) return;

    const velocity = direction.mul(SPEED).mul(50 * dt);
    print(velocity);
    this.root.ApplyImpulse(velocity);
  }
}