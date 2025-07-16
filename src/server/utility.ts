import { Workspace as World } from "@rbxts/services";
import { getDescendantsOfType } from "@rbxts/instance-utility";

const { min, random } = math;

export function stopHacking(player: Player, reason = "unspecified"): void {
  return player.Kick("nice try dum dum\nreason: " + reason);
}

export function findCreatureByID(id: number): Maybe<CreatureServerModel> {
  return World.CreatureServerStorage
    .GetChildren()
    .find((creature): creature is CreatureServerModel => creature.GetAttribute("ID") === id);
}

let cumulativeDropID = 0;

/**
 * Creates a dropped item of the given item, origin, radius, and amount.
 * @param itemTemplate The item template to clone and drop.
 * @param origin The CFrame where the item should be dropped.
 * @param radius An optional Vector3 which specifies the range from the origin where the item could be spawned.
 * If not specified, the item will be spawned at the origin.
 * @param amount The number of items to spawn. If not specified, only one item will be spawned.
 */
export function dropItem(itemTemplate: PVInstance, origin: CFrame, radius: Vector3 = vector.zero, amount = 1): void {
  for (const _ of $range(1, amount)) {
    const id = cumulativeDropID++;
    const drop = itemTemplate.Clone();
    const x = radius.X / 2;
    const y = min(radius.Y / 2, 5);
    const z = radius.Z / 2;
    const offset = vector.create(random(-x, x), random(-y, y), random(-z, z));

    drop.SetAttribute("DropID", id);
    drop.PivotTo(origin.add(offset));
    drop.Destroying.Once(() => cumulativeDropID = id - 1);
    drop.Parent = World.DroppedItems;
    drop.AddTag("DroppedItem");

    for (const part of getDescendantsOfType(drop, "BasePart")) {
      if (part.GetAttribute("UseDefaultDroppedCollisions") === true) continue;
      part.CanCollide = true;
      part.CollisionGroup = "DroppedItems";
    }
  }
}