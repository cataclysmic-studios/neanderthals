import { Controller, type OnStart } from "@flamework/core";
import Signal from "@rbxts/lemon-signal";

import { Message, messaging } from "shared/messaging";
import { type PlayerData, INITIAL_DATA } from "shared/structs/player-data";

const { freeze } = table;

@Controller()
export class ReplicaController implements OnStart {
  public readonly data = INITIAL_DATA;
  public readonly updated = new Signal<(data: PlayerData) => void>;

  public onStart(): void {
    messaging.client.on(Message.DataUpdated, data => this.onDataUpdate(data));
    messaging.server.emit(Message.InitializeData);
  }

  private onDataUpdate(data: PlayerData): void {
    (this as { data: PlayerData }).data = freeze(data);
    this.updated.Fire(data);
  }
}