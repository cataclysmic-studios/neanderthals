import type { u8 } from "@rbxts/serio";

import { ItemID } from "./item-id";

export interface PlayerData {
  readonly inventory: u8[];
}

export const INITIAL_DATA: PlayerData = {
  inventory: [ItemID.Rock]
};