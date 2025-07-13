import type { u8, u16, HashMap, List } from "@rbxts/serio";

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
  readonly hotbar: { [P in 0 | 1 | 2 | 3 | 4 | 5]?: ItemID };
  readonly inventory: HashMap<ItemID, Maybe<u16>, u16>;
  readonly equippedGear: EquippedGear;
  readonly level: number;
  readonly xp: number;
}

export const INITIAL_DATA: PlayerData = {
  hotbar: [Item.GodRock] as never,
  inventory: new Map,
  equippedGear: {},
  xp: 0,
  level: 1
};