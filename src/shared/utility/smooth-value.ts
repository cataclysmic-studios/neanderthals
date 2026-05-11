import { lerp } from ".";

const { min } = math;

export default class SmoothValue {
  public constructor(
    private speed = 1,
    private value = 0,
    private target = 0
  ) { }

  public setTarget(target: number): void {
    this.target = target;
  }

  public update(dt: number): number {
    const alpha = min(dt * this.speed, 1);
    return this.value = lerp(this.value, this.target, alpha);
  }
}