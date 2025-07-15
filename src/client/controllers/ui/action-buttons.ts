import { Controller } from "@flamework/core";

import { mainScreen } from "client/constants";

import type { InventoryUIController } from "./inventory";

@Controller()
export class ActionButtonsUIController {
  private readonly frame = mainScreen.ActionButtons;

  public constructor(inventoryUI: InventoryUIController) {
    this.frame.Inventory.MouseButton1Click.Connect(() => inventoryUI.toggle());
    this.frame.Tribes.MouseButton1Click.Connect(() => { }) // open tribes UI
  }

  public toggle(on: boolean) {
    this.frame.Visible = on;
  }
}