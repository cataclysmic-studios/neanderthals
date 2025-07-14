import { Workspace as World } from "@rbxts/services";

export function stopHacking(player: Player, reason = "unspecified"): void {
  return player.Kick("nice try dum dum\nreason: " + reason);
}

export function findCreatureByID(id: number): Maybe<CreatureServerModel> {
  return World.CreatureServerStorage
    .GetChildren()
    .find((creature): creature is CreatureServerModel => creature.GetAttribute("ID") === id);
}

// TODO: collision shit
export function dropItem(itemTemplate: PVInstance, pivot: CFrame, count = 1): void {
  for (const _ of $range(1, count)) {
    const id = World.DroppedItems.GetChildren().size();
    const drop = itemTemplate.Clone();
    drop.SetAttribute("DropID", id);
    drop.PivotTo(pivot);
    drop.Parent = World.DroppedItems;
    drop.AddTag("DroppedItem");
  }
}