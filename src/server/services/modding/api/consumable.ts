import { Service } from "@flamework/core";

import type { HungerService, PlayerEatInfo } from "server/services/hunger";

@Service()
export class ConsumableModdingAPIService {
  public constructor(
    private readonly hunger: HungerService
  ) { }

  public whenEaten(callback: (info: PlayerEatInfo) => void): () => void {
    const conn = this.hunger.eaten.Connect(callback);
    return () => conn.Disconnect();
  }
}