import { Controller, type OnRender } from "@flamework/core";
import { Workspace as World } from "@rbxts/services";
import Signal from "@rbxts/lemon-signal";

import type { OnCharacterAdd } from "../hooks";
import { player } from "client/constants";
import { XZ } from "shared/constants";

const { min } = math;
const { lookAlong } = CFrame;
const { normalize } = vector;

async function promisifyEvent<Args extends unknown[]>(event: RBXScriptSignal<(...args: Args) => void>): Promise<Args> {
  return new Promise(resolve => event.Once((...args) => resolve(args)));
}

@Controller({ loadOrder: 0 })
export class CharacterController implements OnRender, OnCharacterAdd {
  public readonly spawned = new Signal<(model: CharacterModel) => void>;
  public readonly died = new Signal;

  public onRender(dt: number): void {
    const root = this.getRoot();
    if (!root) return;

    const currentPivot = this.getPivotOrDefault();
    const position = currentPivot.Position;
    const camera = World.CurrentCamera!;
    const lookVector = camera.CFrame.LookVector;
    const direction = normalize(lookVector.mul(XZ));
    const adjustedPivot = lookAlong(position, direction);
    root.CFrame = currentPivot.Lerp(adjustedPivot, 12 * min(dt, 1));
  }

  public async onCharacterAdd(character: CharacterModel): Promise<void> {
    this.spawned.Fire(character);
    character.Humanoid.Died.Once(() => this.died.Fire());
    character.Humanoid.SetStateEnabled(Enum.HumanoidStateType.Swimming, false);
  }

  public isAlive(): boolean {
    const humanoid = this.getHumanoid();
    return player.Character !== undefined
      && humanoid !== undefined
      && humanoid.Health > 0;
  }

  public get(): Maybe<CharacterModel> {
    return player.Character as CharacterModel;
  }

  public async waitFor(): Promise<CharacterModel> {
    return promisifyEvent<[model: CharacterModel]>(player.CharacterAdded)
      .then(([model]) => model);
  }

  public async mustGet(): Promise<CharacterModel> {
    return this.get() ?? await this.waitFor(); // temporary cause this is equally as evil
  }

  public getPosition(): Maybe<Vector3> {
    const root = this.getRoot();
    if (root === undefined) return;

    return root.Position;
  }

  public getPositionOrDefault(defaultPosition: Vector3 = vector.zero): Vector3 {
    return this.getPosition() ?? defaultPosition;
  }

  public getPivot(): Maybe<CFrame> {
    const root = this.getRoot();
    if (root === undefined) return;

    return root.CFrame;
  }

  public getPivotOrDefault(defaultPivot = CFrame.identity): CFrame {
    return this.getPivot() ?? defaultPivot;
  }

  public async mustGetPosition(): Promise<Vector3> {
    return (await this.mustGetRoot()).Position;
  }

  public getRoot(): Maybe<BasePart> {
    const humanoid = this.getHumanoid();
    if (humanoid === undefined) return;

    return humanoid.RootPart;
  }

  public async mustGetRoot(): Promise<BasePart> {
    const humanoid = await this.mustGetHumanoid();
    return humanoid.RootPart!;
  }

  public getHumanoid(): Maybe<CharacterModel["Humanoid"]> {
    return this.get()?.FindFirstChild("Humanoid") as never;
  }

  public async mustGetHumanoid(): Promise<CharacterModel["Humanoid"]> {
    return (await this.mustGet()).Humanoid;
  }

  public getAnimator(): Maybe<Animator> {
    return this.getHumanoid()?.Animator;
  }

  public async mustGetAnimator(): Promise<Animator> {
    return (await this.mustGetHumanoid()).Animator;
  }
}