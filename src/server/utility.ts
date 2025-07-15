import { RunService, Workspace as World } from "@rbxts/services";
import { getDescendantsOfType } from "@rbxts/instance-utility";

export function stopHacking(player: Player, reason = "unspecified"): void {
  return player.Kick("nice try dum dum\nreason: " + reason);
}

export function findCreatureByID(id: number): Maybe<CreatureServerModel> {
  return World.CreatureServerStorage
    .GetChildren()
    .find((creature): creature is CreatureServerModel => creature.GetAttribute("ID") === id);
}

let cumulativeDropID = 0;
export function dropItem(itemTemplate: PVInstance, pivot: CFrame, count = 1): void {
  for (const _ of $range(1, count)) {
    const id = cumulativeDropID++;
    const drop = itemTemplate.Clone();
    drop.SetAttribute("DropID", id);
    drop.PivotTo(pivot);
    drop.Parent = World.DroppedItems;
    drop.AddTag("DroppedItem");

    for (const part of getDescendantsOfType(drop, "BasePart")) {
      if (part.GetAttribute("UseDefaultDroppedCollisions") === true) continue;
      part.CanCollide = true;
      part.CollisionGroup = "DroppedItems";
    }
  }
}

// TODO: fix this shit
const checkInterval = 5;
let elapsed = 0;
RunService.Heartbeat.Connect(dt => {
  elapsed += dt;
  if (elapsed < checkInterval) return;
  elapsed -= checkInterval;

  cumulativeDropID = World.DroppedItems.GetChildren().size();
  task.wait(0.1);
  cumulativeDropID = World.DroppedItems.GetChildren().size();
});