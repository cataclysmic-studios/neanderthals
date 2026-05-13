import { Controller, type OnStart } from "@flamework/core";
import Signal from "@rbxts/lemon-signal";

import { Message, messaging } from "shared/messaging";
import { ItemRegistry } from "shared/registry/item-registry";
import { StructureRegistry } from "shared/registry/structure-registry";
import { RecipeRegistry } from "shared/registry/recipe-registry";
import { IDRegistry } from "shared/registry/id-registry";

@Controller()
export class ContentController implements OnStart {
  public readonly synced = new Signal<() => void>;

  public isSynced = false;

  public onStart(): void {
    messaging.client.on(Message.SyncContent, recipes => {
      RecipeRegistry.sync(recipes);
      IDRegistry.load();
      this.isSynced = true;
      this.synced.Fire();
    });
    messaging.server.emit(Message.ReadyForContent);
  }
}