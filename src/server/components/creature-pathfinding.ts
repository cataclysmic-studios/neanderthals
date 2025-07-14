import { Component } from "@flamework/components";
import { PathfindingService, Workspace as World } from "@rbxts/services";
import { $nameof } from "rbxts-transform-debug";
import DestroyableComponent from "shared/base-components/destroyable";

import { FixedUpdateRate, type OnFixed } from "shared/hooks";
import { distanceBetween, sanitizeVector } from "shared/utility";
import { CREATURE_UPDATE_RATE, XZ } from "shared/constants";

const { random, clamp } = math;
const { normalize } = vector;

const WALK_RADIUS = 24;
const UP50: Vector3 = vector.create(0, 50, 0);
const DOWN100: Vector3 = vector.create(0, -100, 0);

interface Attributes {
  readonly ID: number;
  readonly CreaturePathfinding_Size: Vector3;
  readonly CreaturePathfinding_Speed: number;
}

/** Get a random reachable point */
function getRandomPoint(creature: CreatureServerModel): Maybe<Vector3> {
  const offset = vector.create(
    random(-WALK_RADIUS, WALK_RADIUS),
    0,
    random(-WALK_RADIUS, WALK_RADIUS)
  );

  const origin = creature.Root.Position;
  const target = origin.add(offset);
  const rayOrigin = target.add(UP50);
  const params = new RaycastParams;
  params.FilterDescendantsInstances = [creature];
  params.FilterType = Enum.RaycastFilterType.Exclude;

  const result = World.Raycast(rayOrigin, DOWN100, params);
  return result?.Position
    .mul(XZ)
    .add(vector.create(0, target.Y, 0));
}

@Component({ tag: $nameof<CreaturePathfinding>() })
@FixedUpdateRate(CREATURE_UPDATE_RATE)
export class CreaturePathfinding extends DestroyableComponent<Attributes, CreatureServerModel> implements OnFixed {
  public readonly id = this.attributes.ID;
  public readonly root = this.instance.Root;
  public cframe = CFrame.identity;

  private readonly size = this.attributes.CreaturePathfinding_Size;
  private readonly speed = this.attributes.CreaturePathfinding_Speed;
  private readonly path = this.trash.add(PathfindingService.CreatePath({
    AgentCanClimb: false,
    AgentCanJump: false,
    AgentHeight: this.size.Y,
    AgentRadius: (this.size.X + this.size.Z) / 2,
    WaypointSpacing: 6
  }));

  private waypoints: PathWaypoint[] = [];
  private currentWaypointIndex = 0;
  private isMoving = false;
  private isIdlePathing = false;
  private startPosition?: Vector3;
  private endPosition?: Vector3;
  private moveStartTime = 0;
  private moveDuration = 0;

  public constructor() {
    super();
    this.trash.linkToInstance(this.instance);
  }

  public onFixed(): void {
    if (!this.isMoving) {
      if (!this.isIdlePathing) {
        const point = getRandomPoint(this.instance);
        if (!point) return;

        this.isIdlePathing = true;
        this.moveTo(point).catch(warn).await();
        this.trash.add(task.delay(random(6, 9), () => this.isIdlePathing = false));
        task.wait(0.1); // important
        this.moveToNextWaypoint();
      }
      return;
    }

    const { startPosition, endPosition } = this;
    if (!startPosition || !endPosition) return;

    const elapsed = os.clock() - this.moveStartTime;
    const alpha = clamp(elapsed / this.moveDuration, 0, 1);
    const newPosition = startPosition.Lerp(endPosition, alpha);
    this.setCFrame(newPosition);

    if (alpha < 1) return;
    if (++this.currentWaypointIndex <= this.waypoints.size())
      return this.moveToNextWaypoint();

    this.isMoving = false;
    this.waypoints = [];
  }

  public async moveTo(position: Vector3): Promise<void> {
    return new Promise((resolve, reject) => {
      const { path } = this;
      const startPosition = this.root.Position;
      path.ComputeAsync(startPosition, position);

      if (path.Status !== Enum.PathStatus.Success)
        return reject("Pathfinding failed: " + path.Status.Name);

      this.waypoints = path.GetWaypoints();
      this.currentWaypointIndex = 0;
      this.isMoving = true;
      resolve();
    });
  }

  private moveToNextWaypoint(): void {
    const waypoint = this.waypoints[this.currentWaypointIndex];
    if (!waypoint) {
      this.isMoving = false;
      return;
    }

    const { root } = this;
    const rootPosition = sanitizeVector(root.Position);
    const startPosition = this.startPosition = rootPosition;
    const endPosition = this.endPosition = sanitizeVector(waypoint.Position);
    const distance = distanceBetween(startPosition, endPosition);
    this.moveDuration = distance / this.speed;
    this.moveStartTime = os.clock();
    this.setCFrame(rootPosition);
  }

  private setCFrame(newPosition: Vector3): void {
    const direction = this.getMoveDirection();
    const heightAdjustedPosition = newPosition.mul(XZ).add(vector.create(0, this.size.Y / 2, 0));
    const lookAt = sanitizeVector(heightAdjustedPosition.add(direction));
    this.cframe = this.root.CFrame = new CFrame(heightAdjustedPosition, lookAt);
  }

  private getMoveDirection(): Vector3 {
    return normalize(this.endPosition!.sub(this.startPosition!).mul(XZ));
  }
}