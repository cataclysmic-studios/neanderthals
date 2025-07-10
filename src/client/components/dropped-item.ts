import type { OnStart } from "@flamework/core";
import { Component } from "@flamework/components";
import { $nameof } from "rbxts-transform-debug";

import type { OnCharacterAdd } from "client/hooks";
import type { OnFixed } from "shared/hooks";
import { player } from "client/constants";

import DestroyableComponent from "shared/base-components/destroyable";

@Component({ tag: $nameof<DroppedItem>() })
export class DroppedItem extends DestroyableComponent<{}, Model> implements OnStart, OnFixed, OnCharacterAdd {
  private readonly highlight = this.trash.add(new Instance("Highlight"));
  private readonly dragDetector = this.instance.FindFirstChildOfClass("DragDetector")!;
  private readonly mouse = player.GetMouse();

  public onStart(): void {
    const { highlight } = this;
    highlight.FillColor = new Color3(1, 1, 1);
    highlight.OutlineColor = new Color3(0, 0, 0);
    highlight.FillTransparency = 0.85;
    highlight.OutlineTransparency = 0.8;
    highlight.Enabled = false;
    highlight.Adornee = this.instance;
    highlight.Parent = this.instance;
  }

  public onFixed(): void {
    const target = this.mouse.Target;
    if (!target)
      return this.toggleHighlight(false);

    const targetModel = target.FindFirstAncestorOfClass("Model");
    if (!targetModel)
      return this.toggleHighlight(false);
    if (!targetModel.HasTag($nameof<DroppedItem>()))
      return this.toggleHighlight(false);

    this.toggleHighlight(true);
  }

  public onCharacterAdd(character: CharacterModel): void {
    this.mouse.TargetFilter = character;
  }

  private toggleHighlight(on: boolean): void {
    if (this.dragDetector.ReferenceInstance && !on) return;

    const { highlight } = this;
    if (highlight.Enabled === on) return;
    highlight.Enabled = on;
  }
}