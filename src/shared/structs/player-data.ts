import type { u8, u16, HashMap } from "@rbxts/serio";

import { ItemID } from "./item-id";

export interface PlayerData {
  readonly inventory: HashMap<u8, u16, u16>;
}

export const INITIAL_DATA: PlayerData = {
  inventory: new Map([
    [ItemID.Rock, 1]
  ])
};