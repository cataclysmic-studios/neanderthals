import { Controller, Modding, type OnStart } from "@flamework/core";
import { UserInputService } from "@rbxts/services";

import type { InventoryUIController } from "./ui/inventory";
import type { HotbarUIController } from "./ui/hotbar";

const hotbarKeys = Modding.inspect<HotbarKeys>();

@Controller()
export class InputController implements OnStart {
  public constructor(
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

  private onHotbarKeyPress(hotbarKey: HotbarKey): void {
    const hotbarIndex = hotbarKeys.indexOf(hotbarKey.Name);
    this.hotbarUI.selectButton(hotbarIndex);
  }
}