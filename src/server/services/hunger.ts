import { Service, type OnTick } from "@flamework/core";

import type { OnPlayerAdd, OnPlayerRemove } from "server/hooks";
import { Message, messaging } from "shared/messaging";
import { stopHacking } from "server/utility";
import { getItemByID } from "shared/utility/items";

import type { InventoryService } from "./inventory";

const { clamp } = math;

const HUNGER_TICK_INTERVAL = 4;

@Service()
export class HungerService implements OnTick, OnPlayerAdd, OnPlayerRemove {
  private readonly playerHunger = new Map<Player, number>;
  private elapsed = 0;

  public constructor(inventory: InventoryService) {
    messaging.server.on(Message.Eat, async (player, id) => {
      const item = getItemByID(id);
      if (!item)
        return stopHacking(player, "invalid item ID (no corresponding item) when eating item");

      if (!await inventory.has(player, id))
        return stopHacking(player, "attempt to eat item not in inventory");

      inventory.removeItem(player, id);
      this.eat(player, item);
    });
  }

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