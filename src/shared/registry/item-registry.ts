import { assets } from "shared/constants";

import { ContentRegistry } from "./content-registry";

class ItemRegistryClass extends ContentRegistry {
  public loadVanilla(): void {
    const items = assets.Items.GetChildren() as Model[];
    for (const item of items) {
      this.register(item);
    }
  }

  public register(item: Model): void {
    const id = item.GetAttribute<string>("ID")!;
    this.content.set(id, item);
    this.byName.set(item.Name, id);
  }

  public getAll(): Model[] {
    return [...this.content].map(([_, item]) => item);
  }

  public get<T extends Model = Model>(id: string): T {
    return this.content.get(id) as T;
  }

  public getByName(name: string): Model {
    return this.get(this.byName.get(name)!);
  }
}

export const ItemRegistry = new ItemRegistryClass;
ItemRegistry.loadVanilla();