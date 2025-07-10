export interface StructureConfig {
  readonly respawnTime?: number;
  readonly xp: number;
  readonly drops: ExtractKeys<ReplicatedStorage["Assets"]["Items"], Model>[];
}