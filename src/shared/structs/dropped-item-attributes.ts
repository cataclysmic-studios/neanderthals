import type { GameID } from "./packets";

interface BaseDroppedItemAttributes {
  readonly DisplayName?: string;
  readonly Consumable?: boolean;
  readonly DamageWhenConsumed?: number;
  readonly HungerWhenConsumed?: number;
  readonly CanCook?: boolean;
  readonly CookSpeed?: number;
  readonly CookedVariant?: GameID;
  readonly ID: GameID;
  readonly DropID: number;
}

export type DroppedItemAttributes = BaseDroppedItemAttributes & ({
  readonly CanCook: true;
  readonly CookSpeed: number;
  readonly CookedVariant: GameID;
} | {
  readonly CanCook: false;
  readonly CookSpeed?: undefined;
  readonly CookedVariant?: undefined;
});

export const DEFAULT_DROPPED_ITEM_ATTRIBUTES: Partial<DroppedItemAttributes> = {
  Consumable: false,
  CanCook: false
};