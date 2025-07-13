import { BaseComponent } from "@flamework/components";

import { assets } from "shared/constants";
import { dropItem } from "server/utility";

export abstract class CreatesDropsComponent<A extends {} = {}, I extends PVInstance = PVInstance> extends BaseComponent<A, I> {
  protected createDrops(drops: Maybe<Map<ItemName, number>>, pivot = this.instance.GetPivot()): void {
    if (!drops) return;
    for (const [dropName, count] of drops)
      dropItem(assets.Items[dropName], pivot, count);
  }
}