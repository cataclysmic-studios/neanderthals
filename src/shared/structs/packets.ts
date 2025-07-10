import { u16, i24, Vector, List, Transform } from "@rbxts/serio";

export interface DamagePacket {
  readonly humanoid: Humanoid;
  readonly toolName: ToolName;
}

export interface ToolEquipReplicationPacket {
  readonly player: Player;
  readonly tool: ToolItem;
}

export interface CreatureSpawnPacket {
  readonly name: CreatureName;
  readonly id: u16;
  readonly position: Vector<i24>;
  readonly health: u16;
}

export interface SyncedCreatureData {
  readonly id: u16;
  readonly cframe: Transform<i24>;
}

export type CreatureUpdatePacket = List<SyncedCreatureData, u16>;