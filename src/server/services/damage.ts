import { Service, type OnStart } from "@flamework/core";
import { Players, Workspace as World } from "@rbxts/services";
import { TweenBuilder } from "@rbxts/twin";
import type { Components } from "@flamework/components";

import { Message, messaging } from "shared/messaging";
import { assets, DEFAULT_HITBOX_SIZE, XZ } from "shared/constants";
import { findCreatureByID, stopHacking } from "server/utility";
import { distanceBetween } from "shared/utility";
import { ToolKind } from "shared/structs/tool-kind";
import { ItemRegistry } from "shared/registry/item-registry";
import type { ItemID } from "shared/item-id";

import type { Structure } from "server/components/structure";
import { CreatureConfig } from "shared/structs/creature-config";

const { clamp, floor } = math;
const { magnitude } = vector;

const RNG = new Random;
const DAMAGE_INDICATOR_INFO = new TweenInfo(1, Enum.EasingStyle.Sine);

type DamageType = "Entity" | "Structure";

@Service()
export class DamageService implements OnStart {
  public constructor(
    private readonly components: Components
  ) { }

  public onStart(): void {
    messaging.server.on(Message.Damage, (player, { humanoid, toolID, hitPosition }) =>
      this.damage(player, humanoid, hitPosition, toolID)
    );
    messaging.server.on(Message.DamageCreature, (player, { id, toolID, hitPosition }) =>
      this.damageCreature(player, id, hitPosition, toolID)
    );
  }

  private damageCreature(player: Player, id: number, hitPosition: Vector3, toolID: string): void {
    const creature = findCreatureByID(id);
    if (!creature)
      return warn(`Failed to damage creature with ID ${id}: creature not found`);

    const humanoid = creature.Humanoid;
    this.damage(player, humanoid, hitPosition, toolID, true);
    messaging.client.emitAll(Message.CreatureHealthChange, {
      id,
      health: humanoid.Health,
      attacker: player
    });
  }

  private damage(player: Player, humanoid: Humanoid, hitPosition: Vector3, toolID: string, isCreature = false): void {
    const targetModel = humanoid.Parent;
    if (!targetModel || !targetModel.IsA("Model")) return;

    const targetPlayer = Players.GetPlayerFromCharacter(targetModel);
    const damageType = targetPlayer || isCreature ? "Entity" : humanoid.GetAttribute<DamageType>("DamageType");
    if (damageType === undefined) return;

    const tool = ItemRegistry.get<ToolItem>(toolID);
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
    const [_, targetSize] = targetModel.GetBoundingBox();
    const maxRange = (magnitude(hitboxSize) * 2 + magnitude(targetSize.mul(XZ)));
    if (distanceBetween(modelPosition, playerPosition) > maxRange)
      return stopHacking(player, "out of melee range");

    const currentHealth = humanoid.Health;
    const newHealth = clamp(currentHealth - damage, 0, humanoid.MaxHealth);
    humanoid.SetAttribute("AttackerID", player.UserId);
    if (currentHealth !== newHealth)
      humanoid.Health = newHealth;

    this.createIndicator(floor(damage), hitPosition);

    if (isCreature) return;
    messaging.client.emit(player, Message.ShowDamageDisplay, humanoid);
  }

  private createIndicator(damage: number, hitPosition: Vector3): void {
    const randomDirection = RNG.NextUnitVector();
    const randomSign = RNG.NextInteger(0, 1) * 2 - 1;
    const randomMagnitude = randomSign * RNG.NextNumber(1.25, 2.5);
    const randomOffset = randomDirection.mul(randomMagnitude);
    const indicator = assets.UI.DamageIndicator.Clone();
    indicator.UI.Amount.Text = tostring(damage)
    indicator.Position = hitPosition;
    indicator.Parent = World;

    const goalPosition = hitPosition.add(randomOffset);
    TweenBuilder.for(indicator.UI.Amount)
      .info(DAMAGE_INDICATOR_INFO)
      .propertiesBulk({
        Rotation: randomMagnitude * 3,
        TextTransparency: 1,
      })
      .play();
    TweenBuilder.for(indicator.UI.Amount.UIStroke)
      .info(DAMAGE_INDICATOR_INFO)
      .property("Transparency", 1)
      .play();
    TweenBuilder.for(indicator)
      .info(DAMAGE_INDICATOR_INFO)
      .property("Position", goalPosition)
      .onCompleted(() => indicator.Destroy())
      .play();
  }
}