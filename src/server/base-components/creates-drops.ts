import { BaseComponent } from "@flamework/components";

import { assets } from "shared/constants";
import { dropItem } from "server/utility";

const ITEMS = assets.Items;

export abstract class CreatesDropsComponent<A extends {} = {}, I extends PVInstance = PVInstance> extends BaseComponent<A, I> {
  private readonly radius = this.instance.IsA("Model") ? this.instance.GetBoundingBox()[1] : undefined;

  protected createDrops(drops: Maybe<Map<ItemName, number>>, pivot = this.instance.GetPivot(), radius = this.radius): void {
    if (!drops) return;

    for (const [dropName, count] of drops)
      dropItem(ITEMS[dropName], pivot, radius, count);
  }
}