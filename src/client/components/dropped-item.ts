import type { OnStart } from "@flamework/core";
import { Component, type Components } from "@flamework/components";
import { $nameof } from "rbxts-transform-debug";

import type { OnCharacterAdd } from "client/hooks";
import type { OnFixed } from "shared/hooks";
import { Message, messaging } from "shared/messaging";
import { player } from "client/constants";
import { assets, ITEM_DECAY_TIME } from "shared/constants";
import { distanceBetween, getPartsIncludingSelf } from "shared/utility";
import type { DroppedItemAttributes } from "shared/structs/dropped-item-attributes";

import DestroyableComponent from "shared/base-components/destroyable";
import type { DroppedItemPrompt } from "./dropped-item-prompt";
import type { CharacterController } from "client/controllers/character";
import { Workspace as World } from "@rbxts/services";

const PROMPT_UI = assets.UI.DroppedItemUI;

@Component({
  tag: $nameof<DroppedItem>(),
  ancestorWhitelist: [World]
})
export class DroppedItem extends DestroyableComponent<DroppedItemAttributes, Model> implements OnStart, OnFixed, OnCharacterAdd {
  private readonly highlight = this.trash.add(new Instance("Highlight"));
  private readonly dragDetector = this.instance.FindFirstChildOfClass("DragDetector")!;
  private readonly promptUI = PROMPT_UI.Clone();
  private readonly mouse = player.GetMouse();
  private readonly displayName = (this.attributes.DisplayName ?? this.instance.Name).upper();
  private readonly isFood = this.attributes.FoodItem ?? false;
  private readonly maxDistance = this.dragDetector.MaxActivationDistance;
  private destroyed = false;

  public constructor(
    private readonly components: Components,
    private readonly character: CharacterController
  ) { super(); }

  public onStart(): void {
    const { trash, instance, highlight, promptUI } = this;
    trash.add(() => this.destroyed = true);
    trash.linkToInstance(instance);

    const parts = getPartsIncludingSelf(instance);
    for (const part of parts) {
      part.FindFirstChildOfClass("Weld")?.Destroy();
      part.Anchored = false;
      part.CanCollide = true;
    }
    trash.add(task.delay(3, () => {
      for (const part of parts) {
        part.Anchored = true;
        part.CanCollide = false;
      }
    }));
    trash.add(task.delay(ITEM_DECAY_TIME, () => this.destroy()));

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
    const prompt = trash.add(this.components.addComponent<DroppedItemPrompt>(promptUI));
    trash.add(prompt.consumed.Once(message => {
      if (message === Message.EatDrop && !this.isFood) return;
      messaging.server.emit(message, dropID);
      this.destroy();
    }));
  }

  public onFixed(): void {
    if (this.destroyed) return;

    const target = this.mouse.Target;
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
    const position = targetModel.GetPivot().Position;
    if (distanceBetween(characterPosition, position) >= this.maxDistance)
      return this.toggleHover(false);

    this.toggleHover(true);
  }

  public onCharacterAdd(character: CharacterModel): void {
    this.mouse.TargetFilter = character;
  }

  private toggleHover(on: boolean): void {
    const { highlight, promptUI } = this;
    const dragging = this.dragDetector.ReferenceInstance;
    if (!dragging || on) {
      if (highlight.Enabled === on) return;
      highlight.Enabled = on;
    }

    if (dragging && on) return;
    if (promptUI.Enabled === on) return;
    promptUI.ItemName.Text = this.displayName;
    promptUI.Eat.TextTransparency = this.isFood ? 0 : 1;
    promptUI.Enabled = on;
  }
}