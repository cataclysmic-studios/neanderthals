import { Service, type OnTick } from "@flamework/core";
import Signal from "@rbxts/lemon-signal";

import type { OnPlayerRemove } from "server/hooks";
import { Message, messaging } from "shared/messaging";
import { stopHacking } from "server/utility";
import { ItemRegistry } from "shared/registry/item-registry";

import type { CharacterService } from "./character";
import type { InventoryService } from "./inventory";

const { clamp } = math;

const HUNGER_TICK_INTERVAL = 4;

export interface PlayerEatInfo {
  readonly player: Player;
  readonly id: string;
  readonly hungerGained: number;
  readonly healthGained: number;
}

@Service()
export class HungerService implements OnTick, OnPlayerRemove {
  public readonly consumed = new Signal<(info: PlayerEatInfo) => void>;

  private readonly playerHunger = new Map<Player, number>;
  private elapsed = 0;

  public constructor(character: CharacterService, inventory: InventoryService) {
    messaging.server.on(Message.Consume, async (player, id) => {
      const item = ItemRegistry.get(id);
      if (!item)
        return stopHacking(player, "invalid item ID (no corresponding item) when consuming item");

      if (!await inventory.has(player, id))
        return stopHacking(player, "attempt to consume item not in inventory");

      inventory.removeItem(player, id);
      this.consume(player, item);
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

        if (newHunger === 0) {
          const character = player.Character as CharacterModel;
          if (!character) continue;

          character.Humanoid.Health -= 1;
        }
      }

      this.elapsed -= HUNGER_TICK_INTERVAL;
    }
  }

  public onPlayerRemove(player: Player): void {
    this.playerHunger.delete(player);
  }

  public consume(player: Player, item: Model): void {
    const character = player.Character as CharacterModel;
    if (!character) return;

    const attributes = item.GetAttributes();
    const id = attributes.get("ID") as string;
    const attributeName = "HungerWhenConsumed";
    const hungerWhenConsumed = attributes.get(attributeName) as number;
    if (hungerWhenConsumed === undefined) {
      return warn(`Failed to consume '${item}': consumable item has no '${attributeName}' attribute`);
    }

    const healthWhenConsumed = attributes.get("HealthWhenConsumed") as number;
    const humanoid = character.Humanoid;
    let healthGained = 0;
    if (healthWhenConsumed !== undefined) {
      const newHealth = clamp(humanoid.Health + healthWhenConsumed, 0, humanoid.MaxHealth);
      healthGained = newHealth - humanoid.Health;
      humanoid.Health = newHealth;
    }

    const hunger = this.playerHunger.get(player)!;
    const newHunger = clamp(hunger + hungerWhenConsumed, 0, 100);
    const hungerGained = newHunger - hunger;
    this.playerHunger.set(player, newHunger);
    this.consumed.Fire({ player, id, hungerGained, healthGained });
    messaging.client.emit(player, Message.UpdateHunger, newHunger);
  }

  private onCharacterAdd(player: Player): void {
    this.playerHunger.set(player, 100);
  }
}