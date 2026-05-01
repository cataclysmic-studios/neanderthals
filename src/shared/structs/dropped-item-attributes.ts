import type { ItemID } from "shared/item-id";

interface BaseDroppedItemAttributes {
  readonly DisplayName?: string;
  readonly Food?: boolean;
  readonly DamageWhenEaten?: number;
  readonly HungerWhenEaten?: number;
  readonly CanCook?: boolean;
  readonly CookSpeed?: number;
  readonly CookedVariant?: ItemID;
  readonly ID: ItemID;
  readonly DropID: number;
}

export type DroppedItemAttributes = BaseDroppedItemAttributes & ({
  readonly CanCook: true;
  readonly CookSpeed: number;
  readonly CookedVariant: ItemID;
} | {
  readonly CanCook: false;
  readonly CookSpeed?: undefined;
  readonly CookedVariant?: undefined;
});

export const DEFAULT_DROPPED_ITEM_ATTRIBUTES: Partial<DroppedItemAttributes> = {
  Food: false,
  CanCook: false
};