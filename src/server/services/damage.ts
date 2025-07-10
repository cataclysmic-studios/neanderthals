import { Service, type OnStart } from "@flamework/core";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import { stopHacking } from "shared/utility";

const { magnitude } = vector;

const MAX_MELEE_DISTANCE = 12;

type DamageType = "Entity" | "Structure";

@Service()
export class DamageService implements OnStart {
  public onStart(): void {
    messaging.server.on(Message.Damage, (player, { humanoid, toolName }) => this.damage(player, humanoid, toolName));
  }

  public damage(player: Player, humanoid: Humanoid, toolName: ToolName): void {
    const damageType = humanoid.GetAttribute<DamageType>("DamageType");
    if (!damageType) return;

    const tool = assets.Items[toolName];
    if (!tool)
      return stopHacking(player);

    const damage = tool.GetAttribute<number>(damageType + "Damage");
    if (!damage) return;

    const targetModel = humanoid.Parent;
    if (!targetModel || !targetModel.IsA("Model")) return;

    const character = player.Character;
    if (!character) return;

    const modelPosition = targetModel.GetPivot().Position;
    const playerPosition = character.GetPivot().Position;
    const hitboxSize = tool.GetAttribute<Vector3>("HitboxSize")!;
    const distance = magnitude(modelPosition.sub(playerPosition));
    const checkRange = magnitude(hitboxSize) * 2;
    if (distance > checkRange)
      return stopHacking(player, "out of melee range");

    humanoid.TakeDamage(damage);
  }
}