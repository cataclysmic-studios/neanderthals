import { getItemByID } from "./items";
import type { EquippedGear, PlayerData } from "shared/structs/player-data";

const DEFAULT_BAG_SPACE = 100;
export function getBagSpace(equippedGear: EquippedGear): number {
  if (!equippedGear.bag)
    return DEFAULT_BAG_SPACE;

  const bagID = equippedGear.bag;
  const bagItem = getItemByID(bagID);
  if (!bagItem) {
    warn("Failed to get bag space: no item found with ID", bagID);
    return DEFAULT_BAG_SPACE;
  }

  const attributeName = "BagSpaceGiven";
  const bagSpace = bagItem.GetAttribute<number>(attributeName);
  if (bagSpace === undefined) {
    warn(`Failed to get bag space: item '${bagItem}' equipped as bag has no '${attributeName}' attribute`);
    return DEFAULT_BAG_SPACE;
  }

  return bagSpace;
}

export function calculateBagSpace(hotbar: PlayerData["hotbar"], inventory: PlayerData["inventory"]): number {
  const items = [...(hotbar as number[]).filterUndefined().map<[number, number]>(id => [id, 1]), ...inventory];
  return items.reduce((sum, [id, count]) => {
    const item = getItemByID(id);
    if (!item) {
      warn("Failed to calculate bag space: no item found with ID", id);
      return sum;
    }

    const attributeName = "BagSpace";
    const bagSpaceUsed = item.GetAttribute<number>("BagSpace");
    if (bagSpaceUsed === undefined) {
      warn(`Failed to calculate bag space: item '${item}' has no '${attributeName}' attribute`);
      return sum;
    }

    return sum + bagSpaceUsed * count!;
  }, 0);
}