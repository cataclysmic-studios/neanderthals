import { Controller, Modding, type OnStart } from "@flamework/core";
import { UserInputService } from "@rbxts/services";

import { getItemByID } from "shared/utility/items";

import type { ToolController } from "./tool";
import type { ReplicaController } from "./replica";
import type { InventoryUIController } from "./ui/inventory";

const hotbarKeys = Modding.inspect<HotbarKeys>();

@Controller()
export class InputController implements OnStart {
  public constructor(
    private readonly tool: ToolController,
    private readonly replica: ReplicaController,
    private readonly inventoryUI: InventoryUIController
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
    const itemID = this.replica.data.hotbar[hotbarIndex];
    const tool = getItemByID<ToolItem>(itemID);
    if (!tool) return;

    this.tool.toggleEquipped(tool);
  }
}