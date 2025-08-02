import { ReplicatedStorage, Workspace as World } from "@rbxts/services";

export const assets = ReplicatedStorage.Assets;
export const XZ: Vector3 = vector.create(1, 0, 1);
export const CREATURE_UPDATE_RATE = 10;
export const DEFAULT_HITBOX_SIZE = vector.create(3.2, 3.6, 3.2);
export const CREATURE_DRAW_DISTANCE = 150;

export const PLAYER_SPEED = 16;
export const PLAYER_WATER_SPEED = 8;

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

export const STRUCTURE_OVERLAP_PARAMS = new OverlapParams;
STRUCTURE_OVERLAP_PARAMS.AddToFilter(World.PlacedStructures);
STRUCTURE_OVERLAP_PARAMS.FilterType = Enum.RaycastFilterType.Include;