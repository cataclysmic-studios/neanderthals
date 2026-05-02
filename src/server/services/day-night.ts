import { Service } from "@flamework/core";
import { Lighting } from "@rbxts/services";

import type { OnFixed } from "shared/hooks";

const { min } = math;

@Service()
export class DayNightService implements OnFixed {
  public onFixed(dt: number): void {
    Lighting.ClockTime += min(dt, 1) / 40;
  }
}