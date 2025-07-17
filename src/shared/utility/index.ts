import type { Trash } from "@rbxts/trash";
import type { HashMap } from "@rbxts/serio";

const { max, floor } = math;
const { magnitude } = vector;

export function isValidStructureDistance(overlappingParts: BasePart[], size: Vector3, origin: Vector3): boolean {
  const overlappingStructures = new Set(overlappingParts.mapFiltered(p => p.FindFirstAncestorOfClass("Model")));
  for (const structure of overlappingStructures) {
    const position = structure.PrimaryPart!.Position;
    const distance = distanceBetween(origin, position);
    const closestDistance = max(size.X, size.Y, size.Z) / 3;
    if (distance > closestDistance) continue;

    return false;
  }

  return true;
}

export function getXPToLevelUp(level: number): number {
  return floor(25 + level ** 1.5) - 1;
}

export function weldTool(toolTemplate: ToolItem, character: CharacterModel, trash: Trash): ToolItem {
  const tool = trash.add(toolTemplate.Clone());
  const handle = tool.Handle;
  const handWeld = trash.add(handle.HandWeld);
  const hand = character.RightHand;
  handWeld.Parent = hand;
  handWeld.Part0 = hand;
  handWeld.Part1 = handle;
  tool.Parent = character;

  return tool;
}

export function objectFromEntries<K extends string | number | symbol, V>(entries: [K, V][]): Record<K, V> {
  return new Map(entries) as never; // goat hack
}

export function distanceBetween(a: Vector3, b: Vector3): number {
  return magnitude(a.sub(b));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Returns a new record with key-value pairs from `record1` that don't exist in `record2`,
 * or where the values differ (when using `compareValues` parameter).
 *
 * @example
 * recordDiff({ a: 1, b: 2 }, { b: 3, c: 4 }) // { a: 1, b: 2 }
 */
export function recordDiff<K extends string | number | symbol, V>(
  record1: Record<K, V> | Map<K, V> | HashMap<K, V>,
  record2: Record<K, V> | Map<K, V> | HashMap<K, V>,
  compareValues = true
): Record<K, V> {
  record1 = record1 as Record<K, V>;
  record2 = record2 as Record<K, V>; // silly hack for maps

  const result = {} as Record<K, V>;
  for (const [key] of record1 as Map<K, V>) // silly hack for iteration
    if (!(key in record2) || compareValues && record1[key] !== record2[key])
      result[key] = record1[key];

  return result;
}

export function isNaN(n: number): boolean {
  return n !== n;
}

const MAX = 1e30;
export function sanitizeVector({ X, Y, Z }: Vector3): Vector3 {
  if (isNaN(X) || X >= MAX || X <= -MAX) X = 0;
  if (isNaN(Y) || Y >= MAX || Y <= -MAX) Y = 0;
  if (isNaN(Z) || Z >= MAX || Z <= -MAX) Z = 0;
  return vector.create(X, Y, Z);
}