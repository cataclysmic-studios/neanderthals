import { Service, type OnTick } from "@flamework/core";

import type { OnPlayerRemove } from "server/hooks";
import { Message, messaging } from "shared/messaging";
import { stopHacking } from "server/utility";
import { getItemByID } from "shared/utility/items";

import type { CharacterService } from "./character";
import type { InventoryService } from "./inventory";

const { clamp } = math;

const HUNGER_TICK_INTERVAL = 4;

@Service()
export class HungerService implements OnTick, OnPlayerRemove {
  private readonly playerHunger = new Map<Player, number>;
  private elapsed = 0;

  public constructor(character: CharacterService, inventory: InventoryService) {
    messaging.server.on(Message.Eat, async (player, id) => {
      const item = getItemByID(id);
      if (!item)
        return stopHacking(player, "invalid item ID (no corresponding item) when eating item");

      if (!await inventory.has(player, id))
        return stopHacking(player, "attempt to eat item not in inventory");

      inventory.removeItem(player, id);
      this.eat(player, item);
    });

    character.added.Connect(player => this.onCharacterAdd(player));
  }

  public onTick(dt: number): void {
    const elapsed = this.elapsed += dt;
    if (elapsed >= HUNGER_TICK_INTERVAL) {
      for (const [player, hunger] of this.playerHunger) {
        const newHunger = clamp(hunger - 0.25, 0, 100);
        this.playerHunger.set(player, newHunger);
        messaging.client.emit(player, Message.UpdateHunger, newHunger);
      }

      this.elapsed -= HUNGER_TICK_INTERVAL;
    }
  }

  public onPlayerRemove(player: Player): void {
    this.playerHunger.delete(player);
  }

  public eat(player: Player, item: Model): void {
    const character = player.Character as CharacterModel;
    if (!character) return;

    const attributes = item.GetAttributes();
    const attributeName = "HungerWhenEaten";
    const hungerWhenEaten = attributes.get(attributeName) as number;
    if (hungerWhenEaten === undefined)
      return warn(`Failed to eat '${item}': food item has no '${attributeName}' attribute`);

    const healthWhenEaten = attributes.get("HealthWhenEaten") as number;
    const humanoid = character.Humanoid;
    if (healthWhenEaten !== undefined)
      humanoid.Health = clamp(humanoid.Health + healthWhenEaten, 0, humanoid.MaxHealth);

    const hunger = this.playerHunger.get(player)!;
    const newHunger = clamp(hunger + hungerWhenEaten, 0, 100);
    this.playerHunger.set(player, newHunger);
    messaging.client.emit(player, Message.UpdateHunger, newHunger);
  }

  private onCharacterAdd(player: Player): void {
    this.playerHunger.set(player, 100);
  }
}