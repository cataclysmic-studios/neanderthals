import { Component } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";
import { $nameof } from "rbxts-transform-debug";

import { assets } from "shared/constants";

import { CreatesDropsComponent } from "server/base-components/creates-drops";

@Component({
  tag: $nameof<StructureSpawn>()
})
export class StructureSpawn extends CreatesDropsComponent<{}, BasePart> {
  public constructor() {
    super();

    const template = assets.NaturalStructures[this.instance.Name as NaturalStructureName];
    const structure = template.Clone();
    structure.PivotTo(this.getSpawnCFrame(structure))
    structure.Parent = World.NaturalStructures;
  }

  private getSpawnCFrame(structure: StructureModel): CFrame {
    const [_, size] = structure.GetBoundingBox();
    const creatureOffset = size.Y / 2;
    const spawnOffset = -this.instance.Size.Y / 2;

    return this.instance.CFrame
      .add(Vector3.yAxis.mul(creatureOffset + spawnOffset));
  }
}