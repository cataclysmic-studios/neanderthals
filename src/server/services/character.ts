import { Modding, Service } from "@flamework/core";
import { Workspace as World } from "@rbxts/services";
import Signal from "@rbxts/lemon-signal";

import { ItemRegistry } from "shared/registry/item-registry";
import { RecipeRegistry } from "shared/registry/recipe-registry";
import { IDRegistry } from "shared/registry/id-registry";
import { isToolItem } from "shared/utility/items";
import { dropItem } from "server/utility";
import { EXCLUSIVE_IDS } from "shared/item-id";
import type { OnPlayerAdd } from "server/hooks";

import type { DataService } from "./data";
import type { InventoryService } from "./inventory";
import { HOTBAR_SLOTS } from "shared/constants";

interface RecyclingData {
  readonly recycledGear: number[];
  readonly scrapped: Map<GameID, number>;
}

@Service()
export class CharacterService implements OnPlayerAdd {
  public readonly added = new Signal<(player: Player, character: CharacterModel) => void>;

  public constructor(
    private readonly data: DataService,
    private readonly inventory: InventoryService
  ) { }

  public onPlayerAdd(player: Player): void {
    player.CharacterAdded.Connect(character => this.onCharacterAdd(player, character as never));
  }

  private onCharacterAdd(player: Player, character: CharacterModel): void {
    character.Parent = World.PlayerCharacterStorage;
    character.Humanoid.Died.Once(() => this.onDeath(player, character));

    this.added.Fire(player, character);
    for (const part of character.QueryDescendants<BasePart>("BasePart"))
      part.CollisionGroup = "Players";
  }

  private onDeath(player: Player, character: CharacterModel): void {
    this.removeAndDropRecycled(player, character);
  }

  private async removeAndDropRecycled(player: Player, character: CharacterModel): Promise<void> {
    const { data, inventory } = this;
    await data.update(player, data => {
      for (const slot of HOTBAR_SLOTS) {
        inventory.removeHotbarItem(data, slot);
      }
      return true;
    });

    const { recycledGear, scrapped } = await this.recycleGear(player);
    await data.update(player, data => {
      for (const index of recycledGear) {
        data.inventory.delete(index);
      }
      return true;
    });

    const cframe = character.HumanoidRootPart.CFrame;
    for (const [id, count] of scrapped) {
      const item = ItemRegistry.get(id);
      dropItem(item, cframe, count);
    }
  }

  private async recycleGear(player: Player): Promise<RecyclingData> {
    const items = await this.inventory.get(player);
    const recycledGear: number[] = [];
    const scrapped = new Map<GameID, number>;
    for (const [index, count] of items) {
      const id = IDRegistry.getID(index);
      if (EXCLUSIVE_IDS.has(id)) continue;
      if (count > 1) continue;
      if (!isToolItem(id)) continue;

      recycledGear.push(index);
      const recipe = RecipeRegistry.getItem(id);
      if (!recipe) continue;

      const { ingredients } = recipe;
      if (ingredients.isEmpty()) continue;
      for (const [id, count] of ingredients) {
        const scrappedCount = scrapped.get(id) ?? 0;
        scrapped.set(id, scrappedCount + count);
      }
    }

    return { recycledGear, scrapped };
  }
}