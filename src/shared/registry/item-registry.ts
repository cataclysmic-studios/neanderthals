import { assets } from "shared/constants";

import { ContentRegistry } from "./content-registry";

class ItemRegistryClass extends ContentRegistry {
  public loadVanilla(): void {
    const items = assets.Items.GetChildren() as Model[];
    for (const item of items) {
      this.register(item);
    }
  }
}

export const ItemRegistry = new ItemRegistryClass;
ItemRegistry.loadVanilla();