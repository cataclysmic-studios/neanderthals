import { Controller, type OnStart } from "@flamework/core";
import { UserInputService, Workspace as World } from "@rbxts/services";

import { creatureStorage } from "./replication/creature";

import type { CharacterController } from "./character";

@Controller()
export class InputController implements OnStart {
  private readonly keyDownCallbacks = new Map<Enum.KeyCode, Set<(key: Enum.KeyCode) => void>>;
  private readonly keyUpCallbacks = new Map<Enum.KeyCode, Set<(key: Enum.KeyCode) => void>>;

  public constructor(
    private readonly character: CharacterController,
  ) { }

  public onStart(): void {
    UserInputService.InputBegan.Connect((input, processed) => {
      const callbacks = this.keyDownCallbacks.get(input.KeyCode);
      if (!callbacks) return;
      if (processed) return;

      for (const callback of callbacks) {
        callback(input.KeyCode);
      }
    });
    UserInputService.InputEnded.Connect((input, processed) => {
      const callbacks = this.keyUpCallbacks.get(input.KeyCode);
      if (!callbacks) return;
      if (processed) return;

      for (const callback of callbacks) {
        callback(input.KeyCode);
      }
    });
  }

  public onKeysDown<K extends Enum.KeyCode>(keys: K[], callback: (key: K) => void): void {
    for (const key of keys) {
      this.onKeyDown(key, callback as never);
    }
  }

  public onKeyDown(key: Enum.KeyCode, callback: () => void): void {
    const callbacks = this.keyDownCallbacks.get(key) ?? new Set;
    callbacks.add(callback);
    this.keyDownCallbacks.set(key, callbacks);
  }

  public onKeyUp(key: Enum.KeyCode, callback: () => void): void {
    const callbacks = this.keyUpCallbacks.get(key) ?? new Set;
    callbacks.add(callback);
    this.keyUpCallbacks.set(key, callbacks);
  }

  public getMouseWorldPosition(extraFilter: Instance[] = [], distance = 1000): Maybe<Vector3> {
    return this.createMouseRaycast(extraFilter, distance)?.Position;
  }

  public getMouseTarget(extraFilter: Instance[] = [], distance = 1000): Maybe<BasePart> {
    return this.createMouseRaycast(extraFilter, distance)?.Instance;
  }

  public createMouseRaycast(extraFilter: Instance[] = [], distance = 1000): Maybe<RaycastResult> {
    const camera = World.CurrentCamera!;
    const { X, Y } = UserInputService.GetMouseLocation();
    const { Origin, Direction } = camera.ViewportPointToRay(X, Y);
    const raycastParams = new RaycastParams;
    raycastParams.FilterType = Enum.RaycastFilterType.Exclude;
    raycastParams.AddToFilter([
      this.character.get()!,
      creatureStorage,
      World.CreatureSpawns,
      ...extraFilter
    ]);

    return World.Raycast(Origin, Direction.mul(distance), raycastParams);
  }
}