import type { u8, u16, i16, f24, f32, Vector, List, Transform, String } from "@rbxts/serio";

export type GameID = String<u8>;
export type DropID = u16;
export type CreatureID = u16;

export interface PlayAudioOptions {
  readonly parent?: Instance;
  readonly volume?: f24;
  readonly speed?: f32;
}

export interface AudioPacket extends PlayAudioOptions {
  readonly name: AudioName;
}

export interface PlaceStructurePacket {
  readonly id: GameID;
  readonly recipeIndex: u8;
  readonly cframe: Transform<f24>;
}

export interface AddHotbarItemPacket {
  readonly id: GameID;
  readonly slot: HotbarKeyName;
}

export interface DropItemPacket {
  readonly id: GameID;
  readonly position: Vector<i16>;
}

interface BaseDamagePacket {
  readonly hitPosition: Vector<i16>;
  readonly toolID: GameID;
}

export interface DamagePacket extends BaseDamagePacket {
  readonly humanoid: Humanoid;
}

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
  readonly position: Vector<i16>;
  readonly health: u16;
}

export interface SyncedCreatureData {
  readonly id: CreatureID;
  readonly cframe: Transform<f24>;
}

export type CreatureUpdatePacket = List<SyncedCreatureData, u16>;