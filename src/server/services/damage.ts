import { Service, type OnStart } from "@flamework/core";
import type { Components } from "@flamework/components";
import { Players } from "@rbxts/services";

import { Message, messaging } from "shared/messaging";
import { assets, DEFAULT_HITBOX_SIZE, XZ } from "shared/constants";
import { findCreatureByID, stopHacking } from "server/utility";
import { distanceBetween } from "shared/utility";

import type { Structure } from "server/components/structure";
import { ToolKind } from "shared/structs/tool-kind";

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
    messaging.server.on(Message.DamageCreature, (player, { id, toolName }) => this.damageCreature(player, id, toolName));
  }

  private damageCreature(player: Player, id: number, toolName: ToolName): void {
    const creature = findCreatureByID(id);
    if (!creature)
      return warn(`Failed to damage creature with ID ${id}: creature not found`);

    const humanoid = creature.Humanoid;
    this.damage(player, humanoid, toolName, true);
    messaging.client.emitAll(Message.CreatureHealthChange, {
      id,
      health: humanoid.Health,
      attacker: player
    });
  }

  private damage(player: Player, humanoid: Humanoid, toolName: ToolName, isCreature = false): void {
    const targetModel = humanoid.Parent;
    if (!targetModel || !targetModel.IsA("Model")) return;

    const targetPlayer = Players.GetPlayerFromCharacter(targetModel);
    const damageType = targetPlayer || isCreature ? "Entity" : humanoid.GetAttribute<DamageType>("DamageType");
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

    const toolKind = tool.GetAttribute<ToolKind>("ToolKind");
    const structure = this.components.getComponent<Structure>(targetModel);
    if (structure)
      damage = structure.getDamage(damage, toolTier, toolKind);

    const modelPosition = targetModel.PrimaryPart!.Position;
    const playerPosition = character.GetPivot().Position;
    const hitboxSize = tool.GetAttribute<Vector3>("HitboxSize") ?? DEFAULT_HITBOX_SIZE;
    ;
    const [_, targetSize] = targetModel.GetBoundingBox();
    const maxRange = (magnitude(hitboxSize) * 2 + magnitude(targetSize.mul(XZ)));
    if (distanceBetween(modelPosition, playerPosition) > maxRange)
      return stopHacking(player, "out of melee range");

    const currentHealth = humanoid.Health;
    const newHealth = clamp(currentHealth - damage, 0, humanoid.MaxHealth);
    humanoid.SetAttribute("AttackerID", player.UserId);
    if (currentHealth !== newHealth)
      humanoid.Health = newHealth;

    if (isCreature) return;
    messaging.client.emit(player, Message.ShowDamageDisplay, humanoid);
  }
}