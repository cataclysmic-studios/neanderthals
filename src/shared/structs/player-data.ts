import type { u8, u12, u16 } from "@rbxts/serio";

import { ItemID } from "shared/item-id";
import type { GameID } from "./packets";

export interface EquippedGear {
  readonly head?: GameID;
  readonly chest?: GameID;
  readonly legs?: GameID;
  readonly pouch?: GameID;
  readonly bag?: GameID;
}

// TODO: sort inventories by unique server IDs
// server data should be persistent even when the actual roblox server closes
export interface PlayerData {
  readonly hotbar: { [K in HotbarKeyName]?: GameID };
  readonly inventory: { [K in GameID]?: u12 };
  readonly equippedGear: EquippedGear;
  readonly level: u8;
  readonly xp: u16;
}

export const INITIAL_DATA: PlayerData = {
  hotbar: { One: ItemID.Rock },
  inventory: {},
  equippedGear: {},
  xp: 0,
  level: 1
};