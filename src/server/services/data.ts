import { Modding, Service, type OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { createPlayerStore } from "@rbxts/lyra";
import { createDiff } from "@rbxts/diff";
import { $nameof } from "rbxts-transform-debug";
import Signal from "@rbxts/lemon-signal";

import { Message, messaging } from "shared/messaging";
import { getInitialData, type PlayerData } from "shared/structs/player-data";
import type { OnPlayerAdd, OnPlayerRemove } from "../hooks";

const enum Scope {
  Proto = "PROTO13"
}

declare function pairs<K extends string | number, V>(
  object: Readonly<Record<K, V>>,
): IterableFunction<LuaTuple<[Exclude<K, undefined>, Exclude<V, undefined>]>>;

export function fixNumericKeys<T extends {}>(data: T): T {
  if (!typeIs(data, "table"))
    return data;

  const result = {} as T;
  for (const [key, value] of pairs(data)) {
    const newValue = fixNumericKeys(value);
    if (typeIs(key, "string") && tonumber(key) !== undefined) {
      result[tonumber(key) as never] = newValue;
      continue;
    }

    result[key] = newValue;
  }

  return result;
}

@Service()
export class DataService implements OnStart, OnPlayerAdd, OnPlayerRemove {
  public readonly loaded = new Signal<(player: Player, data: PlayerData) => void>;
  public readonly updated = new Signal<(player: Player, data: PlayerData) => void>;

  private readonly store = createPlayerStore({
    name: $nameof<PlayerData>() + "_" + Scope.Proto,
    template: getInitialData(),
    schema: (v => true) as (v: unknown) => v is Writable<PlayerData>,
    migrationSteps: [
      {
        name: "fix_numeric_keys",
        apply: fixNumericKeys
      }
    ]
  });

  public async onStart(): Promise<void> {
    game.BindToClose(() => this.store.closeAsync());
    messaging.server.on(Message.InitializeData, player => this.onPlayerLoad(player));
  }

  public onPlayerAdd(player: Player): void {
    this.store.loadAsync(player);
  }

  public onPlayerRemove(player: Player): void {
    this.store.unloadAsync(player);
  }

  /** @hidden */
  public onPlayerLoad(player: Player): void {
    const data = this.get(player).expect() as Writable<PlayerData>;
    this.loaded.Fire(player, data);
    const diff = createDiff(getInitialData(), data);
    messaging.client.emit(player, Message.DataUpdated, diff);
  }

  public async get(player: Player): Promise<PlayerData> {
    return fixNumericKeys(await this.store.get(player));
  }

  public async update(player: Player, transform: (data: DeepWritable<PlayerData>) => boolean): Promise<boolean> {
    const original = await this.get(player);
    return await this.store.update(player, data => {
      data.inventory = fixNumericKeys(data.inventory);
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
        for (const [key, value] of pairs(getInitialData()))
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