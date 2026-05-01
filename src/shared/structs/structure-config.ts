import { ItemID } from "shared/item-id";
import type { ToolKind } from "./tool-kind";

export interface StructureConfig {
  readonly hitSound: AudioName;
  readonly xp?: number;
  readonly respawnTime?: number;
  readonly noRespawn?: boolean;
  readonly drops?: Map<ItemID, number>;
  readonly createsStructure?: StructureName;
  readonly minimumToolTier?: number;
  readonly toolKind?: ToolKind;
}