import { Flamework, Service, type OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { createPlayerStore } from "@rbxts/lyra";
import { createDiff } from "@rbxts/diff";
import { $nameof } from "rbxts-transform-debug";
import Signal from "@rbxts/lemon-signal";

import type { OnPlayerAdd, OnPlayerRemove } from "../hooks";
import { Message, messaging } from "shared/messaging";
import { INITIAL_DATA, type PlayerData } from "shared/structs/player-data";
import { StripMeta } from "@rbxts/serio";

const enum Scope {
  Proto = "PROTO10"
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

  public async onStart(): Promise<void> {
    game.BindToClose(() => this.store.closeAsync());
    messaging.server.on(Message.InitializeData, player => this.onPlayerLoad(player));
  }

  public onPlayerAdd(player: Player): void {
    const t = this.store as unknown as { _store: { _ctx: { schema: (value: unknown) => boolean } } };
    t._store._ctx.schema = () => true; // poopy hack

    this.store.loadAsync(player);
  }

  public onPlayerRemove(player: Player): void {
    this.store.unloadAsync(player);
  }

  /** @hidden */
  public onPlayerLoad(player: Player): void {
    const data = this.store.get(player).expect() as Writable<PlayerData>;
    player.SetAttribute("IsDataLoaded", true);
    this.loaded.Fire(player, data);
    const diff = createDiff({} as never, data);
    messaging.client.emit(player, Message.DataUpdated, diff);
  }

  public async get(player: Player): Promise<PlayerData> {
    return await this.store.get(player);
  }

  public async update(player: Player, transform: (data: DeepWritable<PlayerData>) => boolean): Promise<boolean> {
    const original = await this.get(player);
    return await this.store.update(player, data => {
      const success = transform(data);
      if (success)
        task.spawn(() => this.sendUpdate(player, original, data));

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

  private sendUpdate(player: Player, before: PlayerData, data: PlayerData): void {
    const diff = createDiff(before as never, data as never);
    this.updated.Fire(player, data);
    messaging.client.emit(player, Message.DataUpdated, diff);
  }
}