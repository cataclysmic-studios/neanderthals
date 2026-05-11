import { Controller } from "@flamework/core";

import { Message, messaging } from "shared/messaging";
import type { StructureConfig } from "shared/structs/structure-config";

import type { AudioController } from "./audio";
import type { ToolController } from "./tool";

@Controller()
export class DamageController {
  public constructor(
    private readonly audio: AudioController,
    private readonly tool: ToolController
  ) { }

  public deal(model: Model): void {
    const humanoid = model.FindFirstChildOfClass("Humanoid");
    if (!humanoid) return;

    const isCreature = model.HasTag("CreatureSync");
    const toolID = this.tool.getID();
    if (isCreature) {
      const id = model.GetAttribute<number>("ID")!;
      messaging.server.emit(Message.DamageCreature, { id, toolID });
    } else {
      const isStructure = model.HasTag("Structure");
      if (isStructure) {
        const configModule = model.WaitForChild("Config") as ModuleScript;
        const config = require<StructureConfig>(configModule);
        this.audio.playRandomSpeed(config.hitSound, { parent: model });
      }

      messaging.server.emit(Message.Damage, { humanoid, toolID });
    }
  }
}