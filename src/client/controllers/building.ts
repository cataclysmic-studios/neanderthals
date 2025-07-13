import { Controller, type OnTick } from "@flamework/core";
import { UserInputService, Workspace as World } from "@rbxts/services";
import { getDescendantsOfType } from "@rbxts/instance-utility";

import { Message, messaging } from "shared/messaging";
import { player } from "client/constants";
import { getRecipeIndex, getStructureRecipe } from "shared/recipes";

const PASTEL_BLUE = new BrickColor("Pastel Blue");
const DEGREES_PER_SECOND = 160;

const { rad } = math;
const { Angles: angles } = CFrame;

@Controller()
export class BuildingController implements OnTick {
  private readonly mouse = player.GetMouse();
  private currentStructure?: Model;
  private currentStructureSize?: Vector3;
  private hologram?: Model;
  private previousTargetFilter?: Instance;
  private rotation = 0;

  public constructor() {
    this.mouse.Button1Down.Connect(() => this.tryPlace());
  }

  public onTick(dt: number): void {
    const { hologram, currentStructureSize } = this;
    if (!hologram || !this.currentStructure || !currentStructureSize) return;

    if (UserInputService.IsKeyDown("R"))
      this.rotation += dt * DEGREES_PER_SECOND;
    if (UserInputService.IsKeyDown("Q"))
      this.rotation -= dt * DEGREES_PER_SECOND;

    const root = hologram.PrimaryPart!;
    const mouseCFrame = new CFrame(this.mouse.Hit.Position.add(vector.create(0, currentStructureSize.Y / 2, 0)));
    root.CFrame = mouseCFrame.mul(angles(0, rad(this.rotation), 0));
  }

  public enterBuildMode(structure: Model): void {
    if (this.isInBuildMode()) return;

    const hologram = structure.Clone();
    const parts = getDescendantsOfType(hologram, "BasePart");
    for (const part of parts) {
      part.CanCollide = false;

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
    this.previousTargetFilter = this.mouse.TargetFilter;
    this.mouse.TargetFilter = hologram; // TODO: ignore creatures and such too
    hologram.Parent = World;
  }

  public leaveBuildMode(): void {
    if (!this.isInBuildMode()) return;
    this.hologram?.Destroy();
    this.hologram = undefined;
    this.currentStructure = undefined;
    this.currentStructureSize = undefined;
    this.mouse.TargetFilter = this.previousTargetFilter;
    this.previousTargetFilter = undefined;
  }

  private tryPlace(): void {
    if (!this.isInBuildMode()) return;

    const id = this.currentStructure!.GetAttribute<number>("ID");
    if (id === undefined)
      return warn("Failed to place structure: current structure model has no ID");

    const recipe = getStructureRecipe(id);
    if (!recipe)
      return warn("Failed to place structure: current structure model has no corresponding recipe");

    const cframe = this.hologram!.GetPivot();
    const recipeIndex = getRecipeIndex(recipe);
    this.leaveBuildMode();
    messaging.server.emit(Message.PlaceStructure, { id, recipeIndex, cframe });
  }

  private isInBuildMode(): boolean {
    return this.currentStructure !== undefined;
  }
}