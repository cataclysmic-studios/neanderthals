import { Service, type OnTick } from "@flamework/core";

import type { OnPlayerAdd, OnPlayerRemove } from "server/hooks";
import { Message, messaging } from "shared/messaging";

const { clamp } = math;

const HUNGER_TICK_INTERVAL = 4;

@Service()
export class HungerService implements OnTick, OnPlayerAdd, OnPlayerRemove {
  private readonly playerHunger = new Map<Player, number>;
  private elapsed = 0;

  public onTick(dt: number): void {
    const elapsed = this.elapsed += dt;
    if (elapsed >= HUNGER_TICK_INTERVAL) {
      for (const [player, hunger] of this.playerHunger) {
        const newHunger = clamp(hunger - 0.5, 0, 100);
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

  public eat(player: Player, item: Model): void {
    const character = player.Character as CharacterModel;
    if (!character) return;

    const attributes = item.GetAttributes();
    const hungerWhenEaten = attributes.get("HungerWhenEaten") as number;
    if (hungerWhenEaten === undefined)
      return warn("Item has no hunger value");

    const damageWhenEaten = attributes.get("DamageWhenEaten") as number;
    if (damageWhenEaten !== undefined)
      character.Humanoid.TakeDamage(damageWhenEaten);

    const hunger = this.playerHunger.get(player)!;
    const newHunger = clamp(hunger + hungerWhenEaten, 0, 100);
    this.playerHunger.set(player, newHunger);
    messaging.client.emit(player, Message.UpdateHunger, newHunger);
  }
}