import type { u8, u16, u24, HashMap } from "@rbxts/serio";

import { ItemID } from "shared/item-id";
import type { GameID } from "./packets";

export interface EquippedGear {
  readonly head?: GameID;
  readonly chest?: GameID;
  readonly legs?: GameID;
  readonly pouch?: GameID;
  readonly bag?: GameID;
}

export interface PlayerData {
  readonly hotbar: HashMap<HotbarKeyName, Maybe<GameID>, u8>;
  readonly inventory: HashMap<GameID, Maybe<u16>, u16>;
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