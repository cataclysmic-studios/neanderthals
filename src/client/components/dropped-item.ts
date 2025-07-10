import type { OnStart } from "@flamework/core";
import { Component } from "@flamework/components";
import { $nameof } from "rbxts-transform-debug";

import type { OnCharacterAdd } from "client/hooks";
import type { OnFixed } from "shared/hooks";
import { player } from "client/constants";
import { assets } from "shared/constants";

import DestroyableComponent from "shared/base-components/destroyable";
import type { CharacterController } from "client/controllers/character";

const { magnitude } = vector;

const PROMPT_UI = assets.UI.DroppedItemUI;

interface Attributes {
  readonly DisplayName?: string;
  readonly FoodItem?: boolean;
}

@Component({ tag: $nameof<DroppedItem>() })
export class DroppedItem extends DestroyableComponent<Attributes, Model> implements OnStart, OnFixed, OnCharacterAdd {
  private readonly highlight = this.trash.add(new Instance("Highlight"));
  private readonly dragDetector = this.instance.FindFirstChildOfClass("DragDetector")!;
  private readonly prompt = PROMPT_UI.Clone();
  private readonly mouse = player.GetMouse();
  private readonly displayName = (this.attributes.DisplayName ?? this.instance.Name).upper();
  private readonly isFood = this.attributes.FoodItem ?? false;
  private readonly maxDistance = this.dragDetector.MaxActivationDistance;

  public constructor(
    private readonly character: CharacterController
  ) { super(); }

  public onStart(): void {
    const { instance, highlight, prompt } = this;
    highlight.FillColor = new Color3(1, 1, 1);
    highlight.OutlineColor = new Color3(0, 0, 0);
    highlight.FillTransparency = 0.85;
    highlight.OutlineTransparency = 0.8;
    highlight.Enabled = false;
    highlight.Adornee = instance;
    highlight.Parent = instance;

    prompt.Enabled = false;
    prompt.Adornee = instance;
    prompt.Parent = instance;
  }

  public onFixed(): void {
    const target = this.mouse.Target;
    if (!target)
      return this.toggleHover(false);

    const targetModel = target.FindFirstAncestorOfClass("Model");
    if (!targetModel)
      return this.toggleHover(false);
    if (!targetModel.HasTag($nameof<DroppedItem>()))
      return this.toggleHover(false);

    const characterPosition = this.character.getPosition();
    if (!characterPosition)
      return this.toggleHover(false);

    const position = targetModel.GetPivot().Position;
    const distance = magnitude(characterPosition.sub(position));
    if (distance >= this.maxDistance)
      return this.toggleHover(false);

    this.toggleHover(true);
  }

  public onCharacterAdd(character: CharacterModel): void {
    this.mouse.TargetFilter = character;
  }

  private toggleHover(on: boolean): void {
    const { highlight, prompt } = this;
    const dragging = this.dragDetector.ReferenceInstance;
    if (!dragging || on) {
      if (highlight.Enabled === on) return;
      highlight.Enabled = on;
    }

    if (dragging && on) return;
    if (prompt.Enabled === on) return;
    prompt.ItemName.Text = this.displayName;
    prompt.Eat.TextTransparency = this.isFood ? 0 : 1;
    prompt.Enabled = on;
  }
}