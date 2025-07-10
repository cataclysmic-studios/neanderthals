import type { OnStart } from "@flamework/core";
import { Component } from "@flamework/components";
import { UserInputService, Workspace as World } from "@rbxts/services";
import { $nameof } from "rbxts-transform-debug";
import Signal from "@rbxts/lemon-signal";

import { Message } from "shared/messaging";

import DestroyableComponent from "shared/base-components/destroyable";

@Component({
  tag: $nameof<DroppedItemPrompt>(),
  ancestorWhitelist: [World]
})
export class DroppedItemPrompt extends DestroyableComponent<{}, BillboardGui> implements OnStart {
  public readonly consumed = this.trash.add(new Signal<(message: Message.PickUpDrop | Message.EatDrop) => void>);

  public onStart(): void {
    this.trash.add(UserInputService.InputBegan.Connect(input => {
      if (!this.instance.Enabled) return;

      switch (input.KeyCode) {
        case Enum.KeyCode.F:
          this.consumed.Fire(Message.PickUpDrop);
          break;
        case Enum.KeyCode.E:
          this.consumed.Fire(Message.EatDrop);
          break;
      }
    }));
  }

}