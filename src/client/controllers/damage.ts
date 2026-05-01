import { Controller } from "@flamework/core";

import { Message, messaging } from "shared/messaging";
import type { StructureConfig } from "shared/structs/structure-config";

import type { AudioController } from "./audio";
import type { ToolController } from "./tool";

const RNG = new Random;

@Controller()
export class DamageController {
  public constructor(
    private readonly audio: AudioController,
    private readonly tool: ToolController
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
      const isStructure = model.HasTag("Structure");
      if (isStructure) {
        const configModule = model.WaitForChild("Config") as ModuleScript;
        const config = require<StructureConfig>(configModule);
        this.audio.play(config.hitSound, { parent: model, speed: RNG.NextNumber(0.9, 1.1) });
      }

      messaging.server.emit(Message.Damage, { humanoid, toolID, hitPosition });
    }
  }
}