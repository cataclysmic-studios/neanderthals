import { Service } from "@flamework/core";

import type { HungerService, PlayerEatInfo } from "server/services/hunger";

@Service()
export class ConsumableModdingAPIService {
  public constructor(
    private readonly hunger: HungerService
  ) { }

  public whenConsumed(callback: (info: PlayerEatInfo) => void): () => void {
    const conn = this.hunger.consumed.Connect(callback);
    return () => conn.Disconnect();
  }
}