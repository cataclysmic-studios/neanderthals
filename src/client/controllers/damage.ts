import { Controller } from "@flamework/core";

import { Message, messaging } from "shared/messaging";

import type { ToolController } from "./tool";

@Controller()
export class DamageController {
  public constructor(
    private readonly tool: ToolController,
  ) { }

  public deal(model: Model, hitPosition: Vector3): void {
    const humanoid = model.FindFirstChildOfClass("Humanoid");
    if (!humanoid) return;

    const isCreature = model.HasTag("CreatureSync");
    const toolID = this.tool.getID();
    if (isCreature) {
      const id = model.GetAttribute<number>("ID")!;
      messaging.server.emit(Message.DamageCreature, { id, toolID, hitPosition });
    } else {
      messaging.server.emit(Message.Damage, { humanoid, toolID, hitPosition });
    }
  }
}