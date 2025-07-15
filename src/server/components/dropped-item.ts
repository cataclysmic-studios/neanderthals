import type { OnStart } from "@flamework/core";
import { Component } from "@flamework/components";
import { getChildrenOfType } from "@rbxts/instance-utility";
import { $nameof } from "rbxts-transform-debug";

import type { OnFixed } from "shared/hooks";
import { Message, messaging } from "shared/messaging";
import { DEFAULT_DROPPED_ITEM_ATTRIBUTES, type DroppedItemAttributes } from "shared/structs/dropped-item-attributes";

import DestroyableComponent from "shared/base-components/destroyable";
import type { InventoryService } from "server/services/inventory";
import type { LevelsService } from "server/services/levels";
import type { HungerService } from "server/services/hunger";
import { Item } from "shared/item-id";

const { magnitude } = vector;

const DRAG_DISTANCE = 24;
const DECAY_TIME = 360;
const MAX_SPEED = 60;

function getPartsIncludingSelf(instance: Instance): BasePart[] {
  const parts: BasePart[] = [];
  if (instance.IsA("BasePart"))
    parts.push(instance);

  for (const child of getChildrenOfType(instance, "BasePart"))
    for (const part of getPartsIncludingSelf(child))
      parts.push(part);

  return parts;
}

@Component({
  tag: $nameof<DroppedItem>(),
  defaults: DEFAULT_DROPPED_ITEM_ATTRIBUTES
})
export class DroppedItem extends DestroyableComponent<DroppedItemAttributes, Model> implements OnStart, OnFixed {
  private readonly dragDetector = this.trash.add(new Instance("DragDetector"));
  private readonly parts = getPartsIncludingSelf(this.instance);
  private readonly itemID = this.attributes.ID;
  private readonly dropID = this.attributes.DropID;

  public constructor(
    private readonly inventory: InventoryService,
    private readonly levels: LevelsService,
    private readonly hunger: HungerService
  ) { super(); }

  public onStart(): void {
    const { trash, instance, dragDetector } = this;
    trash.linkToInstance(instance);

    const queueFreeze = () => task.delay(2, () => this.freeze(true));
    this.cleanup();
    let freezeThread: Maybe<thread> = trash.add(queueFreeze());
    trash.add(task.delay(DECAY_TIME, () => this.destroy()));

    trash.add(messaging.server.on(Message.PickUpDrop, (player, dropID) => {
      if (dropID !== this.dropID) return;
      this.pickUp(player);
    }));
    trash.add(messaging.server.on(Message.EatDrop, (player, dropID) => {
      if (dropID !== this.dropID) return;
      if (!this.attributes.Food) return;
      this.eat(player);
    }));

    trash.add(dragDetector.DragStart.Connect(() => {
      dragDetector.PermissionPolicy = Enum.DragDetectorPermissionPolicy.Nobody;
      this.freeze(false);
      if (freezeThread) {
        task.cancel(freezeThread);
        freezeThread = undefined;
      }
    }));
    trash.add(dragDetector.DragEnd.Connect(() => {
      dragDetector.PermissionPolicy = Enum.DragDetectorPermissionPolicy.Everybody;
      freezeThread = queueFreeze();
    }));

    dragDetector.MaxActivationDistance = DRAG_DISTANCE;
    dragDetector.DragStyle = Enum.DragDetectorDragStyle.TranslateViewPlane;
    dragDetector.MaxForce = 2000;
    dragDetector.MaxTorque = 1000;
    dragDetector.Responsiveness = 55;
    dragDetector.Parent = instance;
  }

  public eat(player: Player): void {
    this.hunger.eat(player, this.instance);
    this.destroy();
  }

  // speed cap
  public onFixed(): void {
    const root = this.instance.PrimaryPart;
    if (!root) return;

    const velocity = root.AssemblyLinearVelocity;
    if (magnitude(velocity) <= MAX_SPEED) return;

    root.AssemblyLinearVelocity = velocity.div(2);
  }

  private async pickUp(player: Player): Promise<void> {
    assert(this.itemID >= 0, "Item ID for dropped item @" + this.instance.GetFullName() + "is < 0");

    if (this.itemID === Item.Flux) {
      const xpGain = this.instance.GetAttribute<number>("XP") ?? 6;
      this.levels.addXP(player, xpGain);
    } else {
      const success = await this.inventory.addItem(player, this.itemID);
      if (!success) return;
    }

    this.destroy();
  }

  private cleanup(): void {
    for (const part of this.parts)
      part.FindFirstChildOfClass("Weld")?.Destroy();
  }

  private freeze(on: boolean): void {
    for (const part of this.parts) {
      part.Anchored = on;

      if (!on) continue;
      part.AssemblyLinearVelocity = vector.zero;
      part.AssemblyAngularVelocity = vector.zero;
    }
  }
}