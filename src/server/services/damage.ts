import { Service, type OnStart } from "@flamework/core";
import type { Components } from "@flamework/components";
import { Players } from "@rbxts/services";

import { Message, messaging } from "shared/messaging";
import { assets, XZ } from "shared/constants";
import { distanceBetween, stopHacking } from "shared/utility";

import type { Structure } from "server/components/structure";

const { clamp } = math;
const { magnitude } = vector;

type DamageType = "Entity" | "Structure";

@Service()
export class DamageService implements OnStart {
  public constructor(
    private readonly components: Components
  ) { }

  public onStart(): void {
    messaging.server.on(Message.Damage, (player, { humanoid, toolName }) => this.damage(player, humanoid, toolName));
  }

  public damage(player: Player, humanoid: Humanoid, toolName: ToolName): void {
    const targetModel = humanoid.Parent;
    if (!targetModel || !targetModel.IsA("Model")) return;

    const targetPlayer = Players.GetPlayerFromCharacter(targetModel);
    const damageType = targetPlayer ? "Entity" : humanoid.GetAttribute<DamageType>("DamageType");
    if (damageType === undefined) return;

    const tool = assets.Items[toolName];
    if (!tool)
      return stopHacking(player);

    let damage = tool.GetAttribute<number>(damageType + "Damage");
    if (damage === undefined)
      return warn(`Tool '${tool.Name}' has no attribute for ${damageType} damage`);

    const toolTier = tool.GetAttribute<number>("ToolTier");
    if (toolTier === undefined)
      return warn(`Tool '${tool.Name}' has no tool tier`);

    const character = player.Character;
    if (!character) return;

    const structure = this.components.getComponent<Structure>(targetModel);
    if (structure) {
      const { minimumToolTier = 0 } = structure.config;
      if (toolTier < minimumToolTier)
        damage = 0;
    }

    const modelPosition = targetModel.GetPivot().Position;
    const playerPosition = character.GetPivot().Position;
    const hitboxSize = tool.GetAttribute<Vector3>("HitboxSize")!;
    const [_, targetSize] = targetModel.GetBoundingBox();
    const maxRange = magnitude(hitboxSize) * 2 + magnitude(targetSize.mul(XZ));
    if (distanceBetween(modelPosition, playerPosition) > maxRange)
      return stopHacking(player, "out of melee range");

    const currentHealth = humanoid.Health;
    const newHealth = clamp(currentHealth - damage, 0, humanoid.MaxHealth);
    if (currentHealth !== newHealth)
      humanoid.Health = newHealth;

    messaging.client.emit(player, Message.ShowDamageDisplay, humanoid);
  }
}