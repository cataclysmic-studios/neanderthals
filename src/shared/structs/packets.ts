import type { u8, u12, u16, i16, f16, f24, f32, Vector, List, Transform, String, Packed } from "@rbxts/serio";

export type GameID = String<u8>;
export type DropID = u12;
export type CreatureID = u12;

type IntegralPosition = Vector<i16>;
type DecimalTransform = Transform<f16>;

export interface PlayAudioOptions {
  readonly parent?: Instance;
  readonly volume?: f24;
  readonly speed?: f32;
}

export interface AudioPacket extends PlayAudioOptions {
  readonly name: AudioName;
}

export interface DropInteractPacket {
  readonly id: DropID;
  readonly eat: boolean;
}

export interface PlaceStructurePacket {
  readonly id: GameID;
  readonly recipeIndex: u8;
  readonly cframe: DecimalTransform;
  readonly material: u12;
}

export interface AddHotbarItemPacket {
  readonly id: GameID;
  readonly slot: HotbarKeyName;
}

interface BaseDamagePacket {
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
  readonly health: u12;
  readonly attacker: Player;
}

export interface ToolEquipReplicationPacket {
  readonly player: Player;
  readonly tool: ToolItem;
}

export interface CreatureSpawnPacket {
  readonly name: CreatureName;
  readonly id: CreatureID;
  readonly position: IntegralPosition;
  readonly health: u16;
}

export interface SyncedCreatureData {
  readonly id: CreatureID;
  readonly cframe: DecimalTransform;
}

export type CreatureUpdatePacket = Packed<List<SyncedCreatureData, u12>>;