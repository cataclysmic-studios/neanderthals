import type { OnStart } from "@flamework/core";
import { Component, type Components } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";
import { TweenBuilder } from "@rbxts/twin";
import { getDescendantsOfType } from "@rbxts/instance-utility";
import { $nameof } from "rbxts-transform-debug";

import type { OnFixed } from "shared/hooks";
import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import { distanceBetween } from "shared/utility";
import { getDisplayName } from "shared/utility/items";
import { inventoryHasSpace } from "shared/utility/data";
import { DEFAULT_DROPPED_ITEM_ATTRIBUTES, type DroppedItemAttributes } from "shared/structs/dropped-item-attributes";

import DestroyableComponent from "shared/base-components/destroyable";
import type { DroppedItemPrompt } from "./dropped-item-prompt";
import type { ReplicaController } from "client/controllers/replica";
import type { InputController } from "client/controllers/input";
import type { CharacterController } from "client/controllers/character";

const PROMPT_UI = assets.UI.DroppedItemUI;
const PICK_UP_TWEEN_INFO = new TweenInfo(1, Enum.EasingStyle.Sine);

@Component({
  tag: $nameof<DroppedItem>(),
  ancestorWhitelist: [World],
  defaults: DEFAULT_DROPPED_ITEM_ATTRIBUTES
})
export class DroppedItem extends DestroyableComponent<DroppedItemAttributes, Model> implements OnStart, OnFixed {
  private readonly highlight = this.trash.add(new Instance("Highlight"));
  private readonly dragDetector = this.instance.WaitForChild<DragDetector>("DragDetector");
  private readonly promptUI = PROMPT_UI.Clone();
  private readonly displayName = getDisplayName(this.instance);
  private readonly maxDistance = this.dragDetector.MaxActivationDistance;
  private prompt!: DroppedItemPrompt;
  private destroyed = false;

  public constructor(
    private readonly components: Components,
    private readonly replica: ReplicaController,
    private readonly input: InputController,
    private readonly character: CharacterController
  ) { super(); }

  public onStart(): void {
    const { trash, instance, highlight, promptUI } = this;
    trash.add(() => this.destroyed = true);
    trash.linkToInstance(instance);

    highlight.FillColor = new Color3(1, 1, 1);
    highlight.OutlineColor = new Color3(0, 0, 0);
    highlight.FillTransparency = 0.85;
    highlight.OutlineTransparency = 0.8;
    highlight.Enabled = false;
    highlight.Adornee = instance;
    highlight.Parent = instance;

    promptUI.Enabled = false;
    promptUI.Adornee = instance;
    promptUI.Parent = instance;

    const dropID = this.attributes.DropID;
    const prompt = this.prompt = this.components.addComponent<DroppedItemPrompt>(promptUI);
    trash.add(prompt.consumed.Connect(message => {
      if (message === Message.EatDrop && !this.attributes.Food) return;
      if (message === Message.PickUpDrop && !inventoryHasSpace(this.replica.data)) return;
      this.pickUpAnimation();
      messaging.server.emit(message, dropID);
    }));
  }

  public onFixed(): void {
    if (this.destroyed) return;

    const target = this.input.getMouseTarget();
    if (!target)
      return this.toggleHover(false);

    const targetModel = target.FindFirstAncestorOfClass("Model");
    if (
      !targetModel
      || !targetModel.HasTag($nameof<DroppedItem>())
      || targetModel !== this.instance
    ) {
      return this.toggleHover(false);
    }

    const characterPosition = this.character.getPositionOrDefault();
    const position = targetModel.PrimaryPart!.Position;
    if (distanceBetween(characterPosition, position) >= this.maxDistance)
      return this.toggleHover(false);

    this.toggleHover(true);
  }

  private pickUpAnimation(): void {
    const characterPivot = this.character.getPivot();
    if (!characterPivot) return;

    const { instance } = this;
    this.prompt.destroy();

    for (const part of getDescendantsOfType(instance, "BasePart")) {
      part.CanCollide = false;
      part.CastShadow = false;
      TweenBuilder.for(part)
        .info(PICK_UP_TWEEN_INFO)
        .property("Transparency", 1)
        .play();
    }

    TweenBuilder.forModel(instance)
      .info(PICK_UP_TWEEN_INFO)
      .property("Value", characterPivot)
      .onCompleted(() => this.destroy())
      .play();
  }

  private toggleHover(on: boolean): void {
    const { highlight, promptUI } = this;
    const dragging = this.dragDetector.PermissionPolicy === Enum.DragDetectorPermissionPolicy.Nobody;
    if (!dragging || on) {
      if (highlight.Enabled === on) return;
      highlight.Enabled = on;
    }

    if (dragging && on) return;
    if (promptUI.Enabled === on) return;
    promptUI.ItemName.Text = this.displayName;
    promptUI.Eat.TextTransparency = this.attributes.Food ? 0 : 1;
    promptUI.Enabled = on;
  }
}