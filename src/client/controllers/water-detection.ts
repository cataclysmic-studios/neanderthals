import { Controller } from "@flamework/core";
import { Workspace as World } from "@rbxts/services";

import { FixedUpdateRate, type OnFixed } from "shared/hooks";
import { PLAYER_SPEED, PLAYER_WATER_SPEED } from "shared/constants";

import type { CharacterController } from "./character";

const REGION_EXTENTS = vector.one.mul(2);
const RESOLUTION = 4;

function getMaterialAt(position: Vector3): Enum.Material {
  const region = new Region3(position.sub(REGION_EXTENTS), position.add(REGION_EXTENTS)).ExpandToGrid(RESOLUTION);
  const [materials] = World.Terrain.ReadVoxels(region, RESOLUTION);
  return materials[0][0][0];
}

@Controller()
@FixedUpdateRate(5)
export class WaterDetectionController implements OnFixed {
  private inWater = false;

  public constructor(
    private readonly character: CharacterController
  ) { }

  public onFixed(): void {
    const root = this.character.getRoot();
    const humanoid = this.character.getHumanoid();
    if (!root || !humanoid) return;

    const material = getMaterialAt(root.Position);
    const nowInWater = material === Enum.Material.Water;
    if (nowInWater === this.inWater) return;

    this.inWater = nowInWater;
    humanoid.WalkSpeed = nowInWater ? PLAYER_WATER_SPEED : PLAYER_SPEED;
  }
}