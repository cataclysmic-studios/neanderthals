import type { u8, u12, u16, List } from "@rbxts/serio";

import { ItemID } from "shared/item-id";
import { IDRegistry } from "shared/registry/id-registry";
import type { IDIndex } from "./packets";

export interface EquippedGear {
  readonly head?: IDIndex;
  readonly chest?: IDIndex;
  readonly legs?: IDIndex;
  readonly pouch?: IDIndex;
  readonly bag?: IDIndex;
}

// TODO: sort inventories by unique server IDs
// server data should be persistent even when the actual roblox server closes
// maybe some expiration or way to delete old data
export interface PlayerData {
  readonly hotbar: Partial<Record<HotbarKeyName, IDIndex>>;
  readonly inventory: List<Maybe<u12>, u8>;
  readonly equippedGear: EquippedGear;
  readonly level: u8;
  readonly xp: u16;
}

export function getInitialData(): PlayerData {
  return {
    hotbar: { One: IDRegistry.getIndex(ItemID.Rock), },
    inventory: [],
    equippedGear: {},
    xp: 0,
    level: 1
  };
}