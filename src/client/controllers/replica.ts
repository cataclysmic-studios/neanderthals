import { Controller, type OnStart } from "@flamework/core";

import { type PlayerData, INITIAL_DATA } from "shared/structs/player-data";
import Signal from "@rbxts/lemon-signal";
import { Message, messaging } from "shared/messaging";

@Controller({ loadOrder: -500 })
export class ReplicaController implements OnStart {
  public readonly loaded = new Signal;
  public readonly isLoaded: boolean = false;
  public readonly data = INITIAL_DATA;

  public onStart(): void {
    messaging.client.on(Message.DataUpdated, data => this.onDataUpdate(data));
  }

  public onDataUpdate(data: PlayerData): void {
    (this as { data: PlayerData }).data = data;
    if (!this.isLoaded) {
      this.loaded.Fire();
      (this as { isLoaded: boolean }).isLoaded = true;
    }
  }
}