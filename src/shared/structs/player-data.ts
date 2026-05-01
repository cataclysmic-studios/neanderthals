import type { u8, u16, u24, HashMap } from "@rbxts/serio";

import { ItemID } from "../item-id";

export interface EquippedGear {
  readonly head?: ItemID;
  readonly chest?: ItemID;
  readonly legs?: ItemID;
  readonly pouch?: ItemID;
  readonly bag?: ItemID;
}

export interface PlayerData {
  readonly hotbar: HashMap<HotbarKeyName, Maybe<ItemID>, u8>;
  readonly inventory: HashMap<ItemID, Maybe<u16>, u16>;
  readonly equippedGear: EquippedGear;
  readonly level: u8;
  readonly xp: u24;
}

export const INITIAL_DATA: PlayerData = {
  hotbar: new Map([
    ["One", ItemID.Rock]
  ]),
  inventory: new Map,
  equippedGear: {},
  xp: 0,
  level: 1
};