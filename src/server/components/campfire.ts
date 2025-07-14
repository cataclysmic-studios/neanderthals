import { Component, BaseComponent, type Components } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";
import { $nameof } from "rbxts-transform-debug";

import type { OnFixed } from "shared/hooks";
import { dropItem } from "server/utility";
import { distanceBetween } from "shared/utility";
import { getItemByID } from "shared/utility/items";

import type { DroppedItem } from "./dropped-item";

const { clamp } = math;

const RANGE = 20;

interface CampfireModel extends Model {
  Base: BasePart & {
    Attachment: Attachment;
  };
}

@Component({
  tag: $nameof<Campfire>(),
  ancestorWhitelist: [World]
})
export class Campfire extends BaseComponent<{}, CampfireModel> implements OnFixed {
  private readonly cookProgress = new Map<DroppedItem, number>;

  public constructor(
    private readonly components: Components
  ) { super(); }

  public onFixed(dt: number): void {
    const droppedItems = this.components.getAllComponents<DroppedItem>();
    for (const droppedItem of droppedItems) {
      if (!droppedItem.attributes.CanCook) continue;

      const itemPosition = droppedItem.instance.PrimaryPart!.Position;
      const campfirePosition = this.instance.PrimaryPart!.Position;
      const distance = distanceBetween(campfirePosition, itemPosition);
      if (distance > RANGE) {
        this.cookProgress.delete(droppedItem);
        continue;
      }

      const cookProgress = this.cookProgress.get(droppedItem);
      if (cookProgress === undefined) {
        this.cookProgress.set(droppedItem, 0);
        continue;
      }

      const speed = droppedItem.attributes.CookSpeed ?? 0; // dumb
      const amount = dt * speed * clamp(distance + 4 / RANGE, 0, RANGE);
      const newProgress = cookProgress + amount;
      print("cook progress:", newProgress);
      if (newProgress <= 100) {
        this.cookProgress.set(droppedItem, newProgress);
        continue;
      }

      this.cookItem(droppedItem);
      this.cookProgress.delete(droppedItem);
    }
  }

  private cookItem(droppedItem: DroppedItem): void {
    const cframe = droppedItem.instance.PrimaryPart!.CFrame;
    droppedItem.destroy();

    const cookedItem = getItemByID(droppedItem.attributes.CookedVariant!)!;
    dropItem(cookedItem, cframe);
  }
}