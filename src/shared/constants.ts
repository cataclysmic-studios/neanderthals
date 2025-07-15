import { ReplicatedStorage } from "@rbxts/services";

export const assets = ReplicatedStorage.Assets;
export const XZ: Vector3 = vector.create(1, 0, 1);
export const CREATURE_UPDATE_RATE = 10;
export const DEFAULT_HITBOX_SIZE = vector.create(3, 3.5, 3);

export type TribeColorName = typeof TRIBE_COLORS[number]["Name"];
export const TRIBE_COLORS = [
  new BrickColor("Bright red"),
  new BrickColor("Bright yellow"),
  new BrickColor("Bright orange"),
  new BrickColor("Bright green"),
  new BrickColor("Bright blue"),
  new BrickColor("Dark indigo"),
  new BrickColor("Pink"),
  new BrickColor("Brown"),
  new BrickColor("White"),
  new BrickColor("Black")
] as const satisfies BrickColor[];