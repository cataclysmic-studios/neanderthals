export interface StructureConfig {
  readonly xp: number;
  readonly respawnTime?: number;
  readonly noRespawn?: boolean;
  readonly drops?: Map<ExtractKeys<ReplicatedStorage["Assets"]["Items"], Model>, number>;
  readonly createsStructure?: StructureName;
}