import { Flamework, Service, type OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { createPlayerStore } from "@rbxts/lyra";
import { $nameof } from "rbxts-transform-debug";
import Signal from "@rbxts/lemon-signal";

import type { OnPlayerAdd, OnPlayerRemove } from "../hooks";
import { Message, messaging } from "shared/messaging";
import { parseNumberMap, stringifyNumberMap } from "shared/utility/data";
import { INITIAL_DATA, type PlayerData } from "shared/structs/player-data";

const enum Scope {
  Proto = "PROTO7"
}

@Service()
export class DataService implements OnStart, OnPlayerAdd, OnPlayerRemove {
  public readonly loaded = new Signal<(player: Player, data: PlayerData) => void>;
  public readonly updated = new Signal<(player: Player, data: PlayerData) => void>;

  private readonly store = createPlayerStore({
    name: $nameof<PlayerData>() + "_" + Scope.Proto,
    template: INITIAL_DATA,
    schema: Flamework.createGuard<Writable<PlayerData>>(),
  });

  public onStart(): void {
    game.BindToClose(() => this.store.closeAsync());
    messaging.server.on(Message.InitializeData, player => this.onPlayerLoad(player));
  }

  public onPlayerAdd(player: Player): void {
    const t = this.store as unknown as { _store: { _ctx: { schema: (value: unknown) => boolean } } };
    t._store._ctx.schema = () => true;

    this.store.loadAsync(player);
    this.store.updateAsync(player, data => {
      data.inventory = parseNumberMap(data.inventory as never) as never;
      return true;
    });
  }

  public onPlayerRemove(player: Player): void {
    this.store.updateAsync(player, data => {
      data.inventory = stringifyNumberMap(data.inventory as never) as never;
      return true;
    });
    this.store.unloadAsync(player);
  }

  /** @hidden */
  public onPlayerLoad(player: Player): void {
    const loadedData = this.store.get(player).expect() as Writable<PlayerData>;
    player.SetAttribute("IsDataLoaded", true);
    let data = { ...loadedData, inventory: parseNumberMap(loadedData.inventory as never) as never };
    this.loaded.Fire(player, data);
    messaging.client.emit(player, Message.DataUpdated, data);
  }

  public async get(player: Player): Promise<PlayerData> {
    return await this.store.get(player);
  }

  public async update(player: Player, transform: (data: DeepWritable<PlayerData>) => boolean): Promise<boolean> {
    return await this.store.update(player, data => {
      const success = transform(data);
      if (success)
        task.spawn(() => this.sendUpdate(player, data));

      return success;
    });
  }

  public async wipe(): Promise<void> {
    const promises: Promise<boolean>[] = [];
    for (const player of Players.GetPlayers()) {
      promises.push(this.store.update(player, data => {
        for (const [key, value] of pairs(INITIAL_DATA))
          data[key] = value as never;

        return true;
      }));
    }

    return void await Promise.all(promises);
  }

  private sendUpdate(player: Player, data: Writable<PlayerData>): void {
    data = { ...data, inventory: parseNumberMap(data.inventory as never) as never };

    this.updated.Fire(player, data);
    messaging.client.emit(player, Message.DataUpdated, data);
  }
}