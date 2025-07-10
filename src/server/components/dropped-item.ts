import type { OnStart } from "@flamework/core";
import { Component } from "@flamework/components";
import { $nameof } from "rbxts-transform-debug";

import type { OnFixed } from "shared/hooks";
import { Message, messaging } from "shared/messaging";
import type { DroppedItemAttributes } from "shared/structs/dropped-item-attributes";

import DestroyableComponent from "shared/base-components/destroyable";
import type { DataService } from "server/services/data";
import { CollectionService } from "@rbxts/services";

const DRAG_DISTANCE = 24;

@Component({ tag: $nameof<DroppedItem>() })
export class DroppedItem extends DestroyableComponent<DroppedItemAttributes, Model> implements OnStart, OnFixed {
  private readonly dragDetector = this.trash.add(new Instance("DragDetector"));

  public constructor(
    private readonly data: DataService
  ) { super(); }

  public onStart(): void {
    const { trash, instance, dragDetector } = this;
    trash.linkToInstance(instance);

    const itemDropID = this.attributes.DropID;
    trash.add(messaging.server.on(Message.PickUpDrop, (player, dropID) => {
      if (dropID !== itemDropID) return;
      const drops = CollectionService.GetTagged("DroppedItem") as Model[];
      const drop = drops.find(drop => drop.GetAttribute("DropID") === dropID);
      if (!drop)
        return warn("Failed to find drop with ID", dropID);

      this.destroy();
    }));
    trash.add(messaging.server.on(Message.EatDrop, (player, dropID) => {
      if (dropID !== itemDropID) return;
      this.destroy();
    }));

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
    dragDetector.Parent = instance;
  }

  public onFixed(): void {
    // const reference = this.dragDetector.ReferenceInstance as Maybe<BasePart>;
    // if (!reference) return;

    // const { dragDetector } = this;
    // const origin = reference.Position;
    // dragDetector.MaxDragTranslation = origin.add(vector.one.mul(DRAG_DISTANCE));
    // dragDetector.MinDragTranslation = origin.add(vector.one.mul(-DRAG_DISTANCE));
  }
}