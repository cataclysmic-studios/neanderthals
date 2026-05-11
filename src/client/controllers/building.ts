import { Controller, type OnTick } from "@flamework/core";
import { UserInputService, Workspace as World } from "@rbxts/services";

import { Message, messaging } from "shared/messaging";
import { player } from "client/constants";
import { isValidStructureDistance } from "shared/utility";
import { RecipeRegistry } from "shared/registry/recipe-registry";
import { IDRegistry } from "shared/registry/id-registry";
import { STRUCTURE_OVERLAP_PARAMS } from "shared/constants";
import type { StructureConfig } from "shared/structs/structure-config";

import type { InputController } from "./input";

const { abs, rad, round } = math;
const { Angles: angles } = CFrame;

const PASTEL_BLUE = new BrickColor("Pastel Blue");
const BRIGHT_RED = new BrickColor("Bright red");
const ROTATION_DEGREES_PER_SECOND = 160;
const OUT_OUT_BOUNDS_CFRAME = new CFrame(0, 1e8, 0);
const MOUSE_IGNORE = [
  World.DroppedItems,
  World.PlacedStructures,
  World.NaturalStructures,
  World.StructureSpawns,
  World.StructureHolograms
];

function gridSnap(coord: number, gridSize: number): number {
  return round(coord / gridSize) * gridSize;
}

@Controller()
export class BuildingController implements OnTick {
  private readonly mouse = player.GetMouse();
  private currentStructure?: StructureModel;
  private currentStructureSize?: Vector3;
  private currentStructureConfig?: StructureConfig;
  private hologram?: StructureModel;
  private rotation = 0;

  public constructor(
    private readonly input: InputController
  ) {
    this.mouse.Button1Down.Connect(() => this.tryPlace());
  }

  public onTick(dt: number): void {
    const { hologram, currentStructureSize, currentStructureConfig } = this;
    if (!this.isInBuildMode()) return;
    if (!hologram || !currentStructureSize || !currentStructureConfig) return;

    const rotationThisFrame = dt * ROTATION_DEGREES_PER_SECOND;
    if (UserInputService.IsKeyDown("R"))
      this.rotation += rotationThisFrame;
    if (UserInputService.IsKeyDown("Q"))
      this.rotation -= rotationThisFrame;

    const rayResult = this.input.createMouseRaycast(MOUSE_IGNORE);
    if (!rayResult) {
      return hologram.PivotTo(OUT_OUT_BOUNDS_CFRAME);
    }

    let mousePosition = rayResult.Position;
    const normal = rayResult.Normal;
    const material = rayResult.Material;
    const canPlace = this.canPlaceHologram(material);
    const parts = hologram.QueryDescendants<BasePart>("#BasePart");
    for (const part of parts)
      part.BrickColor = canPlace ? PASTEL_BLUE : BRIGHT_RED;

    let yOffset = currentStructureSize.Y / 2;
    const { gridSize, gridSnapY, stackable } = currentStructureConfig;
    if (stackable) {
      let offsetDistance = 0;
      if (abs(normal.X) > 0.5) {
        offsetDistance = currentStructureSize.X / 2;
      } else if (abs(normal.Z) > 0.5) {
        offsetDistance = currentStructureSize.Z / 2;
      } else if (abs(normal.Y) > 0.5) {
        offsetDistance = currentStructureSize.Y / 2;
      }

      const offset = normal.mul(offsetDistance - 0.001);
      mousePosition = mousePosition.add(offset);
      yOffset = 0;
    }

    if (gridSize !== undefined) {
      const snappedX = gridSnap(mousePosition.X, gridSize);
      const snappedZ = gridSnap(mousePosition.Z, gridSize);
      const y = gridSnapY ? gridSnap(mousePosition.Y, gridSize) : mousePosition.Y;
      mousePosition = vector.create(snappedX, y, snappedZ);
    }

    const mouseCFrame = new CFrame(mousePosition.add(vector.create(0, yOffset, 0)));
    hologram.PivotTo(mouseCFrame.mul(angles(0, rad(this.rotation), 0)));
  }

  public enterBuildMode(structure: StructureModel): void {
    if (this.isInBuildMode()) return;

    const hologram = structure.Clone();
    const parts = hologram.QueryDescendants<BasePart>("#BasePart");
    for (const part of parts) {
      part.CanCollide = false;
      part.CastShadow = false;

      if (part.Transparency >= 1) continue;
      if (part.IsA("UnionOperation")) {
        part.UsePartColor = true;
      }
      part.BrickColor = PASTEL_BLUE;
      part.Material = Enum.Material.Glass;
      part.Transparency = 0.5;
    }

    const [_, size] = structure.GetBoundingBox();
    this.rotation = 0;
    this.hologram = hologram;
    this.currentStructure = structure;
    this.currentStructureSize = size;
    this.currentStructureConfig = require<StructureConfig>(structure.Config);
    hologram.Parent = World.StructureHolograms;
  }

  public leaveBuildMode(): void {
    if (!this.isInBuildMode()) return;
    this.hologram?.Destroy();
    this.hologram = undefined;
    this.currentStructure = undefined;
    this.currentStructureSize = undefined;
    this.currentStructureConfig = undefined;
  }

  private tryPlace(): void {
    if (!this.isInBuildMode()) return;

    const rayResult = this.input.createMouseRaycast(MOUSE_IGNORE);
    if (!rayResult) return;

    const material = rayResult.Material;
    if (!this.canPlaceHologram(material)) return;

    const id = this.currentStructure!.GetAttribute<string>("ID")!;
    const recipe = RecipeRegistry.getStructure(id);
    if (!recipe)
      return warn("Failed to place structure: current structure model has no corresponding recipe");

    const cframe = this.hologram!.GetPivot();
    const recipeIndex = RecipeRegistry.getIndex(recipe);
    this.leaveBuildMode();
    messaging.server.emit(Message.PlaceStructure, { id: IDRegistry.getIndex(id), recipeIndex, cframe, material: material.Value });
  }

  private canPlaceHologram(material: Enum.Material): boolean {
    const { hologram, currentStructure, currentStructureConfig } = this;
    if (!hologram || !currentStructure || !currentStructureConfig)
      return false;

    const { requiredSurface } = currentStructureConfig;
    if (requiredSurface !== undefined && material !== requiredSurface)
      return false;

    const root = hologram.PrimaryPart!;
    const origin = root.Position;
    const [_, size] = hologram.GetBoundingBox();
    const overlappingParts = World.GetPartsInPart(root, STRUCTURE_OVERLAP_PARAMS);
    return isValidStructureDistance(overlappingParts, size, origin);
  }

  private isInBuildMode(): boolean {
    return this.currentStructure !== undefined;
  }
}