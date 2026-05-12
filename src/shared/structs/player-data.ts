import type { u8, u12, u16, HashMap } from "@rbxts/serio";

import { ItemID } from "shared/item-id";
import type { SerializedGameID } from "./packets";

export interface EquippedGear {
  readonly head?: SerializedGameID;
  readonly chest?: SerializedGameID;
  readonly legs?: SerializedGameID;
  readonly pouch?: SerializedGameID;
  readonly bag?: SerializedGameID;
}

// TODO: sort inventories by unique server IDs
// server data should be persistent even when the actual roblox server closes
// maybe some expiration or way to delete old data
export interface PlayerData {
  readonly hotbar: Partial<Record<HotbarKeyName, SerializedGameID>>;
  readonly inventory: HashMap<SerializedGameID, Maybe<u12>, u8>;
  readonly equippedGear: EquippedGear;
  readonly level: u8;
  readonly xp: u16;
}

export const INITIAL_DATA: PlayerData = {
  hotbar: { One: ItemID.Rock, },
  inventory: new Map,
  equippedGear: {},
  xp: 0,
  level: 1
};