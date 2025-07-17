import { Service } from "@flamework/core";
import { Workspace as World } from "@rbxts/services";
import { getDescendantsOfType } from "@rbxts/instance-utility";

import type { OnPlayerAdd, OnPlayerRemove } from "server/hooks";
import { Message, messaging } from "shared/messaging";
import { stopHacking } from "server/utility";
import { getStructureByID } from "shared/utility/items";
import { RECIPES } from "shared/recipes";
import type { PlaceStructurePacket } from "shared/structs/packets";

import type { InventoryService } from "./inventory";
import { isValidStructureDistance } from "shared/utility";
import { STRUCTURE_OVERLAP_PARAMS } from "shared/constants";

@Service()
export class BuildingService implements OnPlayerAdd, OnPlayerRemove {
  private readonly placedStructures = new Map<Player, Set<Model>>;

  public constructor(
    private readonly inventory: InventoryService
  ) {
    messaging.server.on(Message.PlaceStructure, (player, packet) => this.place(player, packet));
  }

  public onPlayerAdd(player: Player): void {
    this.placedStructures.set(player, new Set);
  }

  public onPlayerRemove(player: Player): void {
    for (const structure of this.placedStructures.get(player)!)
      structure.Destroy(); // TODO: destroyed structure structures (lol)

    this.placedStructures.delete(player);
  }

  private async place(player: Player, { id, recipeIndex, cframe }: PlaceStructurePacket): Promise<void> {
    const recipe = RECIPES[recipeIndex];
    if (!recipe)
      return stopHacking(player, "recipe index does not exist");

    const structureTemplate = getStructureByID(id);
    if (!structureTemplate)
      return stopHacking(player, "no structure with ID " + id);

    const success = await this.inventory.transaction(player, {
      add: [],
      remove: recipe.ingredients
    });
    if (!success)
      return stopHacking(player, "failed to craft structure");

    if (!this.canPlaceStructure(structureTemplate, cframe)) return;

    const structure = structureTemplate.Clone();
    structure.PivotTo(cframe);
    for (const part of getDescendantsOfType(structure, "BasePart"))
      part.Anchored = true;

    structure.SetAttribute("Structure_OwnerID", player.UserId);
    structure.Parent = World.PlacedStructures;
    this.placedStructures.get(player)!.add(structure);
  }

  private canPlaceStructure(structureTemplate: Model, cframe: CFrame): boolean {
    const [_, size] = structureTemplate.GetBoundingBox();
    const overlappingParts = World.GetPartBoundsInBox(cframe, size, STRUCTURE_OVERLAP_PARAMS);
    const origin = cframe.Position;
    return isValidStructureDistance(overlappingParts, size, origin);
  }
}