import { Controller, type OnStart } from "@flamework/core";

import { Message, messaging } from "shared/messaging";
import { RecipeRegistry } from "shared/registry/recipe-registry";

@Controller()
export class RecipeController implements OnStart {
  public onStart(): void {
    messaging.client.on(Message.SyncRecipes, recipes => RecipeRegistry.sync(recipes));
  }
}