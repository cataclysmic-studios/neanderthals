import { u8, u16, i16, f24, Vector, List, Transform } from "@rbxts/serio";
import { TribeColorName } from "shared/constants";

export type DropID = u8;
export type ItemID = u8;
export type StructureID = u8;
export type CreatureID = u16;

export interface PlaceStructurePacket {
  readonly id: StructureID;
  readonly recipeIndex: u8;
  readonly cframe: Transform<f24>;
}

export interface AddHotbarItemPacket {
  readonly id: ItemID;
  readonly slot: HotbarKey["Name"];
}

export interface DropItemPacket {
  readonly id: ItemID;
  readonly position: Vector<i16>;
}

interface BaseDamagePacket {
  readonly toolID: ItemID;
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