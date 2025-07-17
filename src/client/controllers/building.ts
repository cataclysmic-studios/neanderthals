import { Controller, type OnTick } from "@flamework/core";
import { UserInputService, Workspace as World } from "@rbxts/services";
import { getDescendantsOfType } from "@rbxts/instance-utility";

import { Message, messaging } from "shared/messaging";
import { player } from "client/constants";
import { isValidStructureDistance } from "shared/utility";
import { getRecipeIndex, getStructureRecipe } from "shared/recipes";

import type { InputController } from "./input";
import { STRUCTURE_OVERLAP_PARAMS } from "shared/constants";

const { rad } = math;
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

@Controller()
export class BuildingController implements OnTick {
  private readonly mouse = player.GetMouse();
  private currentStructure?: Model;
  private currentStructureSize?: Vector3;
  private hologram?: Model;
  private rotation = 0;

  public constructor(
    private readonly input: InputController
  ) {
    this.mouse.Button1Down.Connect(() => this.tryPlace());
  }

  public onTick(dt: number): void {
    const { hologram, currentStructureSize } = this;
    if (!hologram || !this.currentStructure || !currentStructureSize) return;

    const rotationThisFrame = dt * ROTATION_DEGREES_PER_SECOND;
    if (UserInputService.IsKeyDown("R"))
      this.rotation += rotationThisFrame;
    if (UserInputService.IsKeyDown("Q"))
      this.rotation -= rotationThisFrame;

    const mousePosition = this.input.getMouseWorldPosition(MOUSE_IGNORE);
    if (!mousePosition) {
      hologram.PivotTo(OUT_OUT_BOUNDS_CFRAME);
      return;
    }

    const canPlace = this.canPlaceHologram();
    const parts = getDescendantsOfType(hologram, "BasePart");
    for (const part of parts)
      part.BrickColor = canPlace ? PASTEL_BLUE : BRIGHT_RED;

    const mouseCFrame = new CFrame(mousePosition.add(vector.create(0, currentStructureSize.Y / 2, 0)));
    hologram.PivotTo(mouseCFrame.mul(angles(0, rad(this.rotation), 0)));
  }

  public enterBuildMode(structure: Model): void {
    if (this.isInBuildMode()) return;

    const hologram = structure.Clone();
    const parts = getDescendantsOfType(hologram, "BasePart");
    for (const part of parts) {
      part.CanCollide = false;
      part.CastShadow = false;

      if (part.Transparency >= 1) continue;
      part.BrickColor = PASTEL_BLUE;
      part.Material = Enum.Material.Glass;
      part.Transparency = 0.5;
    }

    const [_, size] = structure.GetBoundingBox();
    this.rotation = 0;
    this.hologram = hologram;
    this.currentStructure = structure;
    this.currentStructureSize = size;
    hologram.Parent = World.StructureHolograms;
  }

  public leaveBuildMode(): void {
    if (!this.isInBuildMode()) return;
    this.hologram?.Destroy();
    this.hologram = undefined;
    this.currentStructure = undefined;
    this.currentStructureSize = undefined;
  }

  private tryPlace(): void {
    if (!this.isInBuildMode()) return;
    if (!this.canPlaceHologram()) return;

    const id = this.currentStructure!.GetAttribute<number>("ID")!;
    const recipe = getStructureRecipe(id);
    if (!recipe)
      return warn("Failed to place structure: current structure model has no corresponding recipe");

    const cframe = this.hologram!.GetPivot();
    const recipeIndex = getRecipeIndex(recipe);
    this.leaveBuildMode();
    messaging.server.emit(Message.PlaceStructure, { id, recipeIndex, cframe });
  }

  private canPlaceHologram(): boolean {
    const { hologram } = this;
    if (!hologram)
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