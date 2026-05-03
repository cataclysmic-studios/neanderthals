export const enum Permissions {
  ItemSpawning = 1,
  Audio = 2,
  StructureAPI = 4,
  ConsumableAPI = 8,
  All = 16
}

export function setFlag(flags: number, bit: number): number {
  return flags | bit;
}

export function clearFlag(flags: number, bit: number): number {
  return flags & ~bit;
}

export function hasFlag(flags: number, bit: number): boolean {
  return (flags & bit) !== 0;
}

export function toggleFlag(flags: number, bit: number): number {
  return flags ^ bit;
}