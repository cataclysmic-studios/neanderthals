import { Controller, type OnStart } from "@flamework/core";
import { applyDiff, type Diff } from "@rbxts/diff";
import Signal from "@rbxts/lemon-signal";

import { Message, messaging } from "shared/messaging";
import { getInitialData, type PlayerData } from "shared/structs/player-data";

import type { ContentController } from "./content";

const { freeze } = table;

@Controller()
export class ReplicaController implements OnStart {
  public readonly data = getInitialData();
  public readonly updated = new Signal<(data: PlayerData) => void>;

  public constructor(
    private readonly content: ContentController
  ) { }

  public onStart(): void {
    messaging.client.on(Message.DataUpdated, diff => this.onDataUpdate(diff));
    if (!this.content.isSynced) {
      this.content.synced.Wait();
    }
    messaging.server.emit(Message.InitializeData);
  }

  private onDataUpdate(diff: Diff<PlayerData>): void {
    const data = applyDiff(this.data, diff);
    (this as { data: PlayerData; }).data = freeze(data);
    this.updated.Fire(data);
  }
}