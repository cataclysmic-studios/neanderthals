import { BaseComponent } from "@flamework/components";

import { dropItem } from "server/utility";
import { ItemRegistry } from "shared/registry/item-registry";

export abstract class CreatesDropsComponent<A extends {} = {}, I extends PVInstance = PVInstance> extends BaseComponent<A, I> {
  private readonly radius = this.instance.IsA("Model") ? this.instance.GetBoundingBox()[1] : undefined;

  protected createDrops(drops: Maybe<Map<GameID, number>>, pivot = this.instance.GetPivot(), radius = this.radius): void {
    if (!drops) return;

    for (const [id, count] of drops) {
      const item = ItemRegistry.get(id);
      dropItem(item, pivot, count, radius);
    }
  }
}