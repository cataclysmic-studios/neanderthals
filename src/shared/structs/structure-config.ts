import type { ToolKind } from "./tool-kind";
import type { GameID } from "./packets";

export interface StructureConfig {
  readonly hitSound: AudioName;
  readonly xp?: number;
  readonly respawnTime?: number;
  readonly noRespawn?: boolean;
  readonly drops?: Map<GameID, number>;
  readonly destroyedStructure?: GameID;
  /** Minimum tool tier required to destroy the structure */
  readonly minimumToolTier?: number;
  /** Tool kind that is required for the structure to be destroyed (if undefined, any tool will work) */
  readonly toolKind?: ToolKind;
  /** Material that is required for the structure to be placed on */
  readonly requiredSurface?: Enum.Material;
  /** Snap X and Z coordinates to this size */
  readonly gridSize?: number;
  /** Also snap Y coordinate when gridSize is set */
  readonly gridSnapY?: boolean;
  /** If true, mouse does not ignore structure while placing other structures */
  readonly stackable?: boolean;
}