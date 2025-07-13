import { assets } from "shared/constants";
import { objectFromEntries } from "shared/utility";

export const Item = objectFromEntries(
  assets.Items.GetChildren()
    .map<[ItemName, number]>(item => [item.Name as never, item.GetAttribute<number>("ID")!])
    .filter(([_, id]) => id !== undefined)
);

/** Items which may only have one copy in a players inventory and may not be dropped */
export const EXCLUSIVE_IDS = new Set<number>([
  Item.GodRock,
  Item.Rock
]);