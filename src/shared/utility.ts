import { CollectionService, Workspace as World } from "@rbxts/services";
import { getChildrenOfType } from "@rbxts/instance-utility";
import type { Trash } from "@rbxts/trash";

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