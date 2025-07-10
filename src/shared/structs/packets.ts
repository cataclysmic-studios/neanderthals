import { u16, i24, Vector, List, Transform } from "@rbxts/serio";

interface BaseDamagePacket {
  readonly toolName: ToolName;
}

export interface DamagePacket extends BaseDamagePacket {
  readonly humanoid: Humanoid;
}

export type CreatureID = u16;
export interface CreatureDamagePacket extends BaseDamagePacket {
  readonly id: CreatureID;
}

export interface CreatureHealthChangePacket {
  readonly id: CreatureID;
  readonly health: u16;
  readonly attacker: Player;
}

export interface ToolEquipReplicationPacket {
  readonly player: Player;
  readonly tool: ToolItem;
}

export interface CreatureSpawnPacket {
  readonly name: CreatureName;
  readonly id: CreatureID;
  readonly position: Vector<i24>;
  readonly health: u16;
}

export interface SyncedCreatureData {
  readonly id: u16;
  readonly cframe: Transform<i24>;
}

export type CreatureUpdatePacket = List<SyncedCreatureData, u16>;