import { Workspace as World } from "@rbxts/services";
import { getChildrenOfType } from "@rbxts/instance-utility";

const ITEM_DECAY_TIME = 360;

export function stopHacking(player: Player, reason = "unspecified"): void {
  return player.Kick("nice try dum dum\nreason: " + reason);
}

// TODO: collision shit
export function dropItem(item: PVInstance, pivot: CFrame, count = 1): void {
  for (const _ of $range(1, count)) {
    const drop = item.Clone();
    const parts = getParts(drop);
    for (const part of parts) {
      part.FindFirstChildOfClass("Weld")?.Destroy();
      part.Anchored = false;
      part.CanCollide = true;
    }
    drop.PivotTo(pivot);
    drop.Parent = World;

    task.delay(3, () => {
      for (const part of parts) {
        part.Anchored = true;
        part.CanCollide = false;
      }
    });
    task.delay(ITEM_DECAY_TIME, () => item.Destroy());
  }
}

function getParts(instance: Instance): BasePart[] {
  const parts: BasePart[] = [];
  if (instance.IsA("BasePart"))
    parts.push(instance);

  for (const child of getChildrenOfType(instance, "BasePart"))
    for (const part of getParts(child))
      parts.push(part);

  return parts;
}