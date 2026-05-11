import { Service } from "@flamework/core";
import { Workspace as World } from "@rbxts/services";
import Signal from "@rbxts/lemon-signal";

import type { OnPlayerAdd, OnPlayerRemove } from "server/hooks";
import { Message, messaging } from "shared/messaging";
import { stopHacking } from "server/utility";
import { isValidStructureDistance } from "shared/utility";
import { StructureRegistry } from "shared/registry/structure-registry";
import { RecipeRegistry } from "shared/registry/recipe-registry";
import { IDRegistry } from "shared/registry/id-registry";
import { STRUCTURE_OVERLAP_PARAMS } from "shared/constants";
import type { StructureConfig } from "shared/structs/structure-config";
import type { PlaceStructurePacket } from "shared/structs/packets";

import type { InventoryService } from "./inventory";

export interface PlayerStructureInfo {
  readonly player: Player;
  readonly id: string;
  readonly model: Model;
}

@Service()
export class BuildingService implements OnPlayerAdd, OnPlayerRemove {
  public readonly structurePlaced = new Signal<(info: PlayerStructureInfo) => void>;
  public readonly structureDestroyed = new Signal<(info: PlayerStructureInfo) => void>;

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

  private async place(player: Player, { id, recipeIndex, cframe, material }: PlaceStructurePacket): Promise<void> {
    const recipe = RecipeRegistry.get(recipeIndex);
    if (!recipe)
      return stopHacking(player, "recipe index does not exist");

    const structureID = IDRegistry.getID(id);
    if (recipe.yield !== structureID)
      return stopHacking(player, "recipe yield does not match structure ID");

    const structureTemplate = StructureRegistry.get<StructureModel>(structureID);
    if (!structureTemplate)
      return stopHacking(player, "no structure with ID " + structureID);

    const success = await this.inventory.transaction(player, {
      add: [],
      remove: recipe.ingredients
    });
    if (!success)
      return stopHacking(player, "failed to craft structure");

    const { requiredSurface, stackable, noAnchor } = require<StructureConfig>(structureTemplate.Config);
    if (requiredSurface !== undefined && Enum.Material.FromValue(material) !== requiredSurface) return;
    if (!this.canPlaceStructure(structureTemplate, cframe)) return;

    const structure = structureTemplate.Clone();
    structure.PivotTo(cframe);
    structure.SetAttribute("Structure_OwnerID", player.UserId);
    if (!noAnchor) {
      for (const part of structure.QueryDescendants<BasePart>("BasePart[Anchored = false]")) {
        part.Anchored = true;
      }
    }

    structure.Parent = stackable ? World.StackableStructures : World.PlacedStructures;
    this.placedStructures.get(player)!.add(structure);
    this.structurePlaced.Fire({ player, id: structureID, model: structure });
  }

  private canPlaceStructure(structureTemplate: Model, cframe: CFrame): boolean {
    const [_, size] = structureTemplate.GetBoundingBox();
    const overlappingParts = World.GetPartBoundsInBox(cframe, size, STRUCTURE_OVERLAP_PARAMS);
    const origin = cframe.Position;
    return isValidStructureDistance(overlappingParts, size, origin);
  }
}