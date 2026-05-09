import { Service } from "@flamework/core";

import type { BuildingService, PlayerStructureInfo } from "server/services/building";

@Service()
export class StructureModdingAPIService {
  public constructor(
    private readonly building: BuildingService
  ) { }

  public whenPlaced(callback: (info: PlayerStructureInfo) => void): () => void {
    const conn = this.building.structurePlaced.Connect(callback);
    return () => conn.Disconnect();
  }
}