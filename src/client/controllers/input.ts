import { Controller, type OnStart } from "@flamework/core";
import { UserInputService } from "@rbxts/services";

import { getItemByID } from "shared/utility";

import type { ToolController } from "./tool";
import type { ReplicaController } from "./replica";
import type { InventoryUIController } from "./ui/inventory";

type HotbarKey = typeof hotbarKeys[number];
const hotbarKeys = [
  Enum.KeyCode.One,
  Enum.KeyCode.Two,
  Enum.KeyCode.Three,
  Enum.KeyCode.Four,
  Enum.KeyCode.Five,
  Enum.KeyCode.Six,
  Enum.KeyCode.Seven,
  Enum.KeyCode.Eight,
  Enum.KeyCode.Nine
] as const;

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
        case Enum.KeyCode.Seven:
        case Enum.KeyCode.Eight:
        case Enum.KeyCode.Nine:
          this.onHotbarKeyPress(input.KeyCode);
          break;

        case Enum.KeyCode.B:
          this.inventoryUI.toggle();
          break;
      }
    });
  }

  private onHotbarKeyPress(hotbarKey: HotbarKey): void {
    const hotbarIndex = hotbarKeys.indexOf(hotbarKey);
    const itemID = this.replica.data.hotbar[hotbarIndex];
    const tool = getItemByID<ToolItem>(itemID);
    if (!tool) return;

    if (this.tool.hasEquipped(tool))
      return this.tool.unequip();

    this.tool.unequip();
    this.tool.equip(tool);
  }
}