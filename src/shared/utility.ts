import { Workspace as World } from "@rbxts/services";
import { getChildrenOfType } from "@rbxts/instance-utility";
import type { Trash } from "@rbxts/trash";
import type { HashMap } from "@rbxts/serio";

import { assets } from "./constants";

const { magnitude } = vector;

export function stopHacking(player: Player, reason = "unspecified"): void {
  return player.Kick("nice try dum dum\nreason: " + reason);
}

let cumulativeDropID = 0;
// TODO: collision shit
export function dropItem(item: PVInstance, pivot: CFrame, count = 1): void {
  for (const _ of $range(1, count)) {
    const id = cumulativeDropID++;
    const drop = item.Clone();
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
export function getItemByID<T extends Model = Model>(id: number): Maybe<T> {
  const cachedItem = itemCache.get(id);
  if (cachedItem)
    return cachedItem as T;

  const item = items.find(item => item.GetAttribute("ID") === id);
  if (item)
    itemCache.set(id, item);

  return item as T;
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

export function findClientCreatureByID(id: number): Maybe<CreatureModel> {
  return World
    .FindFirstChild("CreatureClientStorage")!
    .GetChildren()
    .find((creature): creature is CreatureModel => creature.GetAttribute("ID") === id);
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