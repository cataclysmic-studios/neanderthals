export interface DroppedItemAttributes {
  readonly DisplayName?: string;
  readonly Food?: boolean;
  readonly DamageWhenEaten?: number;
  readonly HungerWhenEaten?: number;
  readonly CanCook?: boolean;
  readonly ID: number;
  readonly DropID: number;
}

export const DEFAULT_DROPPED_ITEM_ATTRIBUTES = {
  Food: false,
  CanCook: false
};