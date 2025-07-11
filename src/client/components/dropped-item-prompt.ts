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
  public static canConsume = true;

  public readonly consumed = this.trash.add(new Signal<(message: Message.PickUpDrop | Message.EatDrop) => void>);

  public onStart(): void {
    this.trash.add(UserInputService.InputBegan.Connect(input => {
      if (!this.instance.Enabled) return;

      switch (input.KeyCode) {
        case Enum.KeyCode.F:
          this.consume(Message.PickUpDrop);
          break;
        case Enum.KeyCode.E:
          this.consume(Message.EatDrop);
          break;
      }
    }));
    this.trash.add(this.instance.GetPropertyChangedSignal("Enabled").Connect(() => {
      if (!this.instance.Enabled) return;

      if (UserInputService.IsKeyDown("F"))
        this.consume(Message.PickUpDrop);
      else if (UserInputService.IsKeyDown("E"))
        this.consume(Message.EatDrop);
    }));
  }

  private consume(message: Message.PickUpDrop | Message.EatDrop): void {
    if (!DroppedItemPrompt.canConsume) return;
    DroppedItemPrompt.canConsume = false;
    task.delay(0.06, () => DroppedItemPrompt.canConsume = true);

    this.consumed.Fire(message);
  }
}