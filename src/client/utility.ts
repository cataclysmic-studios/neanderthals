import { Workspace as World } from "@rbxts/services";
import ViewportModel from "@rbxts/viewportmodel";

import { getItemByID } from "shared/utility";

const { rad } = math;
const { identity, Angles: angles } = CFrame;

const ITEM_ORIENTATION = angles(0, rad(45), 0);

export function addViewportItem<T extends Model>(viewport: ViewportFrame, item: T): Maybe<T>;
export function addViewportItem<T extends Model>(viewport: ViewportFrame, id: number): Maybe<T>;
export function addViewportItem<T extends Model>(viewport: ViewportFrame, id: T | number): Maybe<T> {
  const itemTemplate = typeIs(id, "number") ? getItemByID<T>(id) : id;
  if (!itemTemplate) return;

  const displayOffset = itemTemplate.GetAttribute<CFrame>("DisplayOffset") ?? CFrame.identity;
  const item = itemTemplate.Clone();
  let camera = viewport.FindFirstChildOfClass("Camera");
  if (!camera)
    camera = new Instance("Camera", viewport);

  if (viewport.CurrentCamera !== camera)
    viewport.CurrentCamera = camera;

  item.PrimaryPart!.CFrame = ITEM_ORIENTATION.mul(displayOffset);
  item.Parent = viewport;

  const viewportModel = new ViewportModel(viewport, camera);
  viewportModel.setModel(item);

  const fitDistance = viewportModel.getFitDistance(vector.zero);
  camera.Focus = identity;
  camera.FieldOfView = 50;
  camera.CFrame = new CFrame(
    vector.create(0, fitDistance, fitDistance),
    vector.zero
  );
}

export function removeViewportItem(viewport: ViewportFrame): void {
  viewport.FindFirstChildOfClass("Model")?.Destroy();
}

export function findClientCreatureByID(id: number): Maybe<CreatureModel> {
  return World
    .FindFirstChild("CreatureClientStorage")!
    .GetChildren()
    .find((creature): creature is CreatureModel => creature.GetAttribute("ID") === id);
}