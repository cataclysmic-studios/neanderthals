import type { ToolKind } from "./tool-kind";

export interface StructureConfig {
  readonly xp: number;
  readonly respawnTime?: number;
  readonly noRespawn?: boolean;
  readonly drops?: Map<ItemName, number>;
  readonly createsStructure?: StructureName;
  readonly minimumToolTier?: number;
  readonly toolKind?: ToolKind;
}