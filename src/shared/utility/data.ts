import { getItemByID } from "./items";
import type { ItemID } from "shared/item-id";
import type { EquippedGear, PlayerData } from "shared/structs/player-data";

export function inventoryHasSpace({ equippedGear, hotbar, inventory }: PlayerData | DeepWritable<PlayerData>) {
  const maxBagSpace = getMaxBagSpace(equippedGear as never);
  const bagSpace = calculateBagSpace(hotbar as never, inventory as never);
  return bagSpace + 1 <= maxBagSpace;
}

const DEFAULT_BAG_SPACE = 100;
export function getMaxBagSpace(equippedGear: EquippedGear): number {
  if (!equippedGear.bag)
    return DEFAULT_BAG_SPACE;

  const bagID = equippedGear.bag;
  const bagItem = getItemByID(bagID);
  const attributeName = "BagSpaceGiven";
  const bagSpace = bagItem.GetAttribute<number>(attributeName);
  if (bagSpace === undefined) {
    warn(`Failed to get bag space: item '${bagItem}' equipped as bag has no '${attributeName}' attribute`);
    return DEFAULT_BAG_SPACE;
  }

  return bagSpace;
}

export function calculateBagSpace(hotbar: PlayerData["hotbar"], inventory: PlayerData["inventory"]): number {
  const items = [
    ...[...hotbar].mapFiltered<[ItemID, number]>(([_, id]) => id !== undefined ? [id, 1] : undefined!),
    ...inventory
  ];

  return items.reduce((sum, [id, count]) => {
    const item = getItemByID(id);
    const attributeName = "BagSpace";
    const bagSpaceUsed = item.GetAttribute<number>("BagSpace");
    if (bagSpaceUsed === undefined) {
      warn(`Failed to calculate bag space: item '${item}' has no '${attributeName}' attribute`);
      return sum;
    }

    return sum + bagSpaceUsed * count!;
  }, 0);
}