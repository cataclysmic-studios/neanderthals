import { Modding, Reflect } from "@flamework/core";

export interface OnFixed {
  /** @hidden */
  onFixed(dt: number): void;
}

export const updateRateMeta = "OnFixed:updateRate";
export const FixedUpdateRate = Modding.createDecorator<[hz: number]>("Class", (descriptor, [hz]) =>
  Reflect.defineMetadata(descriptor.object, updateRateMeta, hz)
);