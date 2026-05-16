import type { Trash } from "@rbxts/trash";

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

export function distanceBetween(a: Vector3, b: Vector3): number {
  return magnitude(a.sub(b));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
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