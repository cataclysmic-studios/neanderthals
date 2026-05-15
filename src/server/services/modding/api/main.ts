import { Service } from "@flamework/core";
import Signal from "@rbxts/lemon-signal";

import { dropItem } from "server/utility";
import { ItemRegistry } from "shared/registry/item-registry";

import type { AudioService } from "server/services/audio";
import type { ConsumableModdingAPIService } from "./consumable";
import type { StructureModdingAPIService } from "./structure";

@Service()
export class MainModdingAPIService {
  public readonly dropPickedUp = new Signal<(dropID: number, itemID: GameID) => void>;

  public constructor(
    public readonly audio: AudioService,
    public readonly consumable: ConsumableModdingAPIService,
    public readonly structure: StructureModdingAPIService
  ) { }

  public spawnItem(id: GameID, origin: CFrame, amount = 1): number[] {
    const itemTemplate = ItemRegistry.get(id);
    return dropItem(itemTemplate, origin, amount);
  }
}