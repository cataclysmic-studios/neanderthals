import { assets } from "shared/constants";
import { objectFromEntries } from "shared/utility";

export const Structure = objectFromEntries(
  assets.Structures.GetChildren()
    .map<[StructureName, number]>(item => [item.Name as never, item.GetAttribute<number>("ID")!])
    .filter(([_, id]) => id !== undefined)
);