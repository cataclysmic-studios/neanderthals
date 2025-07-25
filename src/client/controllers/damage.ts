import { Controller } from "@flamework/core";

import { Message, messaging } from "shared/messaging";

import type { ToolController } from "./tool";

@Controller()
export class DamageController {
  public constructor(
    private readonly tool: ToolController,
  ) { }

  public deal(model: Model): void {
    const humanoid = model.FindFirstChildOfClass("Humanoid");
    if (!humanoid) return;

    const isCreature = model.HasTag("CreatureSync");
    const toolID = this.tool.getID();
    if (isCreature)
      messaging.server.emit(Message.DamageCreature, { id: model.GetAttribute<number>("ID")!, toolID });
    else
      messaging.server.emit(Message.Damage, { humanoid, toolID });
  }
}