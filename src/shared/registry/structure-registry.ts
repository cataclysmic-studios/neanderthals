import { assets } from "shared/constants";

import { ContentRegistry } from "./content-registry";

class StructureRegistryClass extends ContentRegistry {
  public load(): void {
    const items = assets.Structures.GetChildren() as Model[];
    for (const item of items) {
      this.register(item);
    }
  }
}

export const StructureRegistry = new StructureRegistryClass;