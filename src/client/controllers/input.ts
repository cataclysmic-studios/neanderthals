import { Controller, type OnStart } from "@flamework/core";
import { UserInputService, Workspace as World } from "@rbxts/services";

import { creatureStorage } from "./replication/creature";
import type { CharacterController } from "./character";
import type { InventoryUIController } from "./ui/inventory";
import type { HotbarUIController } from "./ui/hotbar";
import { TribesUIController } from "./ui/tribes";

@Controller()
export class InputController implements OnStart {
  public constructor(
    private readonly character: CharacterController,
    private readonly inventoryUI: InventoryUIController,
    private readonly tribesUI: TribesUIController,
    private readonly hotbarUI: HotbarUIController
  ) { }

  public onStart(): void {
    UserInputService.InputBegan.Connect(input => {
      switch (input.KeyCode) {
        case Enum.KeyCode.One:
        case Enum.KeyCode.Two:
        case Enum.KeyCode.Three:
        case Enum.KeyCode.Four:
        case Enum.KeyCode.Five:
        case Enum.KeyCode.Six:
          this.hotbarUI.selectButton(input.KeyCode.Name);
          break;

        case Enum.KeyCode.B:
          this.inventoryUI.toggle();
          break;
        case Enum.KeyCode.T:
          this.tribesUI.toggle();
          break;
      }
    });
  }

  public getMouseWorldPosition(extraFilter: Instance[] = [], distance = 1000): Maybe<Vector3> {
    return this.createMouseRaycast(extraFilter, distance)?.Position;
  }

  public getMouseTarget(extraFilter: Instance[] = [], distance = 1000): Maybe<BasePart> {
    return this.createMouseRaycast(extraFilter, distance)?.Instance;
  }

  private createMouseRaycast(extraFilter: Instance[] = [], distance = 1000): Maybe<RaycastResult> {
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