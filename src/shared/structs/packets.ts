import { u8, u16, i16, f24, Vector, List, Transform } from "@rbxts/serio";
import type { ItemID } from "shared/item-id";
import type { StructureID } from "shared/structure-id";

export type DropID = u16;
export type CreatureID = u16;

export interface PlaceStructurePacket {
  readonly id: StructureID;
  readonly recipeIndex: u8;
  readonly cframe: Transform<f24>;
}

export interface AddHotbarItemPacket {
  readonly id: ItemID;
  readonly slot: HotbarKeyName;
}

export interface DropItemPacket {
  readonly id: ItemID;
  readonly position: Vector<i16>;
}

interface BaseDamagePacket {
  readonly hitPosition: Vector<i16>;
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