import { BaseComponent } from "@flamework/components";

import { dropItem } from "server/utility";
import { getItemByID } from "shared/utility/items";
import type { ItemID } from "shared/item-id";

export abstract class CreatesDropsComponent<A extends {} = {}, I extends PVInstance = PVInstance> extends BaseComponent<A, I> {
  private readonly radius = this.instance.IsA("Model") ? this.instance.GetBoundingBox()[1] : undefined;

  protected createDrops(drops: Maybe<Map<ItemID, number>>, pivot = this.instance.GetPivot(), radius = this.radius): void {
    if (!drops) return;

    for (const [id, count] of drops) {
      const item = getItemByID(id);
      dropItem(item, pivot, radius, count);
    }
  }
}