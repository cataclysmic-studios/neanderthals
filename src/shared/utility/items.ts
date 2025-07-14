import { assets } from "../constants";

const items = assets.Items.GetChildren() as Model[];
const itemCache = new Map<number, Model>;
for (const item of items)
  itemCache.set(item.GetAttribute<number>("ID")!, item);

export function getItemByID<T extends Model = Model>(id: number): T {
  return itemCache.get(id) as T;
}

const structures = assets.Structures.GetChildren() as Model[];
const structureCache = new Map<number, Model>;
for (const structure of structures)
  structureCache.set(structure.GetAttribute<number>("ID")!, structure);

export function getStructureByID<T extends Model = Model>(id: number): T {
  return structureCache.get(id) as T;
}

interface DisplayNameOptions {
  readonly uppercase?: boolean;
}

export function getDisplayName(item: Model, { uppercase = true }: DisplayNameOptions = {}): string {
  const name = item.GetAttribute<string>("DisplayName") ?? item.Name;
  return uppercase ? name.upper() : name;
}