import { Controller, type OnStart } from "@flamework/core";

import { Message, messaging } from "shared/messaging";
import { type PlayerData, INITIAL_DATA } from "shared/structs/player-data";

@Controller()
export class ReplicaController implements OnStart {
  public readonly data = INITIAL_DATA;

  public onStart(): void {
    messaging.client.on(Message.DataUpdated, data => this.onDataUpdate(data));
    messaging.server.emit(Message.InitializeData);
  }

  public onDataUpdate(data: PlayerData): void {
    (this as { data: PlayerData }).data = data;
  }
}