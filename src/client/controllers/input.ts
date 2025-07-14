import { Controller, Modding, type OnStart } from "@flamework/core";
import { UserInputService, Workspace as World } from "@rbxts/services";

import { creatureStorage } from "./replication/creature";
import type { CharacterController } from "./character";
import type { InventoryUIController } from "./ui/inventory";
import type { HotbarUIController } from "./ui/hotbar";

const hotbarKeys = Modding.inspect<HotbarKeys>();

@Controller()
export class InputController implements OnStart {
  public constructor(
    private readonly character: CharacterController,
    private readonly inventoryUI: InventoryUIController,
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
          this.onHotbarKeyPress(input.KeyCode);
          break;

        case Enum.KeyCode.B:
          this.inventoryUI.toggle();
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

  private onHotbarKeyPress(hotbarKey: HotbarKey): void {
    const hotbarIndex = hotbarKeys.indexOf(hotbarKey.Name);
    this.hotbarUI.selectButton(hotbarIndex);
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
      ...extraFilter
    ]);

    return World.Raycast(Origin, Direction.mul(distance), raycastParams);
  }
}