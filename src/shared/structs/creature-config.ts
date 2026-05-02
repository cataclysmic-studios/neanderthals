import type { ItemID } from "shared/item-id";

export interface CreatureConfig {
  readonly xp: number;
  readonly drops?: Map<ItemID, number>;
  readonly idleSound: AudioName;
  readonly damageSound: AudioName;
}