import type { u8, u16, HashMap, List } from "@rbxts/serio";

import { ItemID } from "./item-id";

export interface PlayerData {
  readonly hotbar: List<u8, u8>;
  readonly inventory: HashMap<u8, u16, u16>;
}

export const INITIAL_DATA: PlayerData = {
  hotbar: [ItemID.GodRock],
  inventory: new Map
};