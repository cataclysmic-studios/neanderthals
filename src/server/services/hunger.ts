import { Service, type OnTick } from "@flamework/core";

import type { OnPlayerAdd, OnPlayerRemove } from "server/hooks/players";
import { Message, messaging } from "shared/messaging";

const HUNGER_TICK_INTERVAL = 3.5;

@Service()
export class HungerService implements OnTick, OnPlayerAdd, OnPlayerRemove {
  private readonly playerHunger = new Map<Player, number>;
  private elapsed = 0;

  public onTick(dt: number): void {
    const elapsed = this.elapsed += dt;
    if (elapsed >= HUNGER_TICK_INTERVAL) {
      for (const [player, hunger] of this.playerHunger) {
        const newHunger = hunger - 0.5;
        this.playerHunger.set(player, newHunger);
        messaging.client.emit(player, Message.UpdateHunger, newHunger);
      }

      this.elapsed -= HUNGER_TICK_INTERVAL;
    }
  }

  public onPlayerAdd(player: Player): void {
    player.CharacterAdded.Connect(() => this.playerHunger.set(player, 100));
  }

  public onPlayerRemove(player: Player): void {
    this.playerHunger.delete(player);
  }
}