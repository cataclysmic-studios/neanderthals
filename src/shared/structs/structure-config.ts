import type { ToolKind } from "./tool-kind";
import type { GameID } from "./packets";

export interface StructureConfig {
  readonly hitSound: AudioName;
  readonly xp?: number;
  readonly respawnTime?: number;
  readonly noRespawn?: boolean;
  readonly drops?: Map<GameID, number>;
  readonly destroyedStructure?: GameID;
  readonly minimumToolTier?: number;
  readonly toolKind?: ToolKind;
  readonly requiredSurface?: Enum.Material;
}