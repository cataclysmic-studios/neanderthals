import type { u8, u16, HashMap } from "@rbxts/serio";

import { Item } from "../item-id";
import type { ItemID } from "./packets";

export interface EquippedGear {
  readonly head?: ItemID;
  readonly chest?: ItemID;
  readonly legs?: ItemID;
  readonly pouch?: ItemID;
  readonly bag?: ItemID;
}

export interface PlayerData {
  readonly hotbar: HashMap<HotbarKey["Name"], Maybe<ItemID>, u8>;
  readonly inventory: HashMap<ItemID, Maybe<u16>, u16>;
  readonly equippedGear: EquippedGear;
  readonly level: number;
  readonly xp: number;
}

export const INITIAL_DATA: PlayerData = {
  hotbar: new Map([
    ["One", Item.GodRock]
  ]),
  inventory: new Map,
  equippedGear: {},
  xp: 0,
  level: 1
};