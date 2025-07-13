import type { OnStart } from "@flamework/core";
import { Component, type Components } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";
import { $nameof } from "rbxts-transform-debug";

import type { OnCharacterAdd } from "client/hooks";
import type { OnFixed } from "shared/hooks";
import { Message, messaging } from "shared/messaging";
import { player } from "client/constants";
import { assets } from "shared/constants";
import { distanceBetween } from "shared/utility";
import { getItemDisplayName } from "shared/utility/items";
import { DEFAULT_DROPPED_ITEM_ATTRIBUTES, type DroppedItemAttributes } from "shared/structs/dropped-item-attributes";

import DestroyableComponent from "shared/base-components/destroyable";
import type { DroppedItemPrompt } from "./dropped-item-prompt";
import type { CharacterController } from "client/controllers/character";

const PROMPT_UI = assets.UI.DroppedItemUI;

@Component({
  tag: $nameof<DroppedItem>(),
  ancestorWhitelist: [World],
  defaults: DEFAULT_DROPPED_ITEM_ATTRIBUTES
})
export class DroppedItem extends DestroyableComponent<DroppedItemAttributes, Model> implements OnStart, OnFixed, OnCharacterAdd {
  private readonly highlight = this.trash.add(new Instance("Highlight"));
  private readonly dragDetector = this.instance.WaitForChild<DragDetector>("DragDetector");
  private readonly promptUI = PROMPT_UI.Clone();
  private readonly mouse = player.GetMouse();
  private readonly displayName = getItemDisplayName(this.instance);
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
      if (message === Message.EatDrop && !this.attributes.Food) return;
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
    const position = targetModel.PrimaryPart!.Position;
    if (distanceBetween(characterPosition, position) >= this.maxDistance)
      return this.toggleHover(false);

    this.toggleHover(true);
  }

  public onCharacterAdd(character: CharacterModel): void {
    this.mouse.TargetFilter = character;
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