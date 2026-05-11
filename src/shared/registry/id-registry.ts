import { Registry } from "./registry";
import { ItemRegistry } from "./item-registry";
import { StructureRegistry } from "./structure-registry";

export class IDRegistryClass extends Registry {
  private ids: GameID[] = [];

  public getIndex(id: GameID): number {
    return this.ids.indexOf(id);
  }

  public getID(index: number): GameID {
    const id = this.ids[index];
    assert(id !== undefined, "failed to get ID from registry by index: index " + index + " does not exist");
    return id;
  }

  public load(): void {
    const items = ItemRegistry.getAllIDs();
    const structures = StructureRegistry.getAllIDs();
    // const recipes = RecipeRegistry.getAll();

    this.ids = [...items, ...structures].sort();
  }
}

export const IDRegistry = new IDRegistryClass;