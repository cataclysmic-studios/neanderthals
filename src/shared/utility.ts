import { Workspace as World } from "@rbxts/services";
import { getChildrenOfType } from "@rbxts/instance-utility";
import type { Trash } from "@rbxts/trash";
import type { HashMap } from "@rbxts/serio";

import { assets } from "./constants";
import type { EquippedGear } from "./structs/player-data";

const { magnitude } = vector;

export function stopHacking(player: Player, reason = "unspecified"): void {
  return player.Kick("nice try dum dum\nreason: " + reason);
}

let cumulativeDropID = 0;
// TODO: collision shit
export function dropItem(itemTemplate: PVInstance, pivot: CFrame, count = 1): void {
  for (const _ of $range(1, count)) {
    const id = cumulativeDropID++;
    const drop = itemTemplate.Clone();
    drop.SetAttribute("DropID", id);
    drop.PivotTo(pivot);
    drop.Destroying.Once(() => cumulativeDropID--);
    drop.Parent = World;
    drop.AddTag("DroppedItem");
  }
}

export function getPartsIncludingSelf(instance: Instance): BasePart[] {
  const parts: BasePart[] = [];
  if (instance.IsA("BasePart"))
    parts.push(instance);

  for (const child of getChildrenOfType(instance, "BasePart"))
    for (const part of getPartsIncludingSelf(child))
      parts.push(part);

  return parts;
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

const items = assets.Items.GetChildren() as Model[];
const itemCache = new Map<number, Model>;
for (const item of items)
  itemCache.set(item.GetAttribute<number>("ID")!, item);

export function getItemByID<T extends Model = Model>(id: number): Maybe<T> {
  return itemCache.get(id) as T;
}

export function getItemDisplayName(item: Model): string {
  return (item.GetAttribute<string>("DisplayName") ?? item.Name).upper()
}

export function objectFromEntries<K extends string | number | symbol, V>(entries: [K, V][]): Record<K, V> {
  return new Map(entries) as never; // goat hack
}

export function distanceBetween(a: Vector3, b: Vector3) {
  return magnitude(a.sub(b));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function findServerCreatureByID(id: number): Maybe<CreatureServerModel> {
  return World.CreatureServerStorage
    .GetChildren()
    .find((creature): creature is CreatureServerModel => creature.GetAttribute("ID") === id);
}

const DEFAULT_BAG_SPACE = 100;
export function getBagSpace(equippedGear: EquippedGear): number {
  if (!equippedGear.bag)
    return DEFAULT_BAG_SPACE;

  const bagID = equippedGear.bag;
  const bagItem = getItemByID(bagID);
  if (!bagItem) {
    warn("Failed to get bag space: no item found with ID", bagID);
    return DEFAULT_BAG_SPACE;
  }

  const attributeName = "BagSpaceGiven";
  const bagSpace = bagItem.GetAttribute<number>(attributeName);
  if (bagSpace === undefined) {
    warn(`Failed to get bag space: item '${bagItem}' equipped as bag has no '${attributeName}' attribute`);
    return DEFAULT_BAG_SPACE;
  }

  return bagSpace;
}

export function calculateBagSpace(hotbar: number[], inventory: Map<number, number>): number {
  const items = [...hotbar.map<[number, number]>(id => [id, 1]), ...inventory];
  return items.reduce((sum, [id, count]) => {
    const item = getItemByID(id);
    if (!item) {
      warn("Failed to calculate bag space: no item found with ID", id);
      return sum;
    }

    const attributeName = "BagSpace";
    const bagSpaceUsed = item.GetAttribute<number>("BagSpace");
    if (bagSpaceUsed === undefined) {
      warn(`Failed to calculate bag space: item '${item}' has no '${attributeName}' attribute`);
      return sum;
    }

    return sum + bagSpaceUsed * count;
  }, 0);
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