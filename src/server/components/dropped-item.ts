import type { OnStart } from "@flamework/core";
import { Component } from "@flamework/components";
import { $nameof } from "rbxts-transform-debug";

import type { OnFixed } from "shared/hooks";

import DestroyableComponent from "shared/base-components/destroyable";

const DRAG_DISTANCE = 24;

@Component({ tag: $nameof<DroppedItem>() })
export class DroppedItem extends DestroyableComponent<{}, Model> implements OnStart, OnFixed {
  private readonly dragDetector = this.trash.add(new Instance("DragDetector"));

  public onStart(): void {
    const { trash, dragDetector } = this;
    trash.add(dragDetector.DragStart.Connect(player => {
      dragDetector.ReferenceInstance = player.Character?.FindFirstChild("HumanoidRootPart");
      dragDetector.PermissionPolicy = Enum.DragDetectorPermissionPolicy.Nobody;
    }));
    trash.add(dragDetector.DragEnd.Connect(() => {
      dragDetector.ReferenceInstance = undefined;
      dragDetector.PermissionPolicy = Enum.DragDetectorPermissionPolicy.Everybody;
    }));

    dragDetector.MaxActivationDistance = DRAG_DISTANCE;

    dragDetector.DragStyle = Enum.DragDetectorDragStyle.TranslateViewPlane;
    dragDetector.MaxForce = 1000;
    dragDetector.MaxTorque = 100;
    dragDetector.Responsiveness = 100;
    dragDetector.Parent = this.instance;
  }

  public onFixed(): void {
    const reference = this.dragDetector.ReferenceInstance as Maybe<BasePart>;
    if (!reference) return;

    const { dragDetector } = this;
    const origin = reference.Position;
    dragDetector.MaxDragTranslation = origin.add(vector.one.mul(DRAG_DISTANCE));
    dragDetector.MinDragTranslation = origin.add(vector.one.mul(-DRAG_DISTANCE));
  }
}