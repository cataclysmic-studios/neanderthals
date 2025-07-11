import { assets } from "shared/constants";
import { objectFromEntries } from "shared/utility";

export const ItemID = objectFromEntries(
  assets.Items.GetChildren()
    .map<[ItemName, number]>(item => [item.Name as never, item.GetAttribute<number>("ID")!])
    .filter(([_, id]) => id !== undefined)
);

/** Items which are tools */
export const TOOL_IDS = new Set<number>([
  ItemID.Rock,
  ItemID.GodRock
]);

/** Items which may only have one copy in a players inventory and may not be dropped */
export const EXCLUSIVE_IDS = new Set<number>([
  ItemID.Rock
]);