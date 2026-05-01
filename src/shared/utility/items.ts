import { assets } from "../constants";
import type { StructureID } from "shared/structure-id";
import type { ItemID } from "shared/item-id";

const items = assets.Items.GetChildren() as Model[];
const itemCache = new Map<ItemID, Model>;
for (const item of items) {
  const id = item.GetAttribute<ItemID>("ID");
  assert(id !== undefined, `Item '${item}' has no ID`);
  assert(typeIs(id, "string"), `Item ID '${id}' on item '${item}' is invalid; must be a string`);
  itemCache.set(id, item);
}

export function getItemByID<T extends Model = Model>(id: ItemID): T {
  return itemCache.get(id) as T;
}

const structures = assets.Structures.GetChildren() as Model[];
const structureCache = new Map<StructureID, Model>;
for (const structure of structures) {
  const id = structure.GetAttribute<StructureID>("ID");
  assert(id !== undefined, `Structure '${structure}' has no ID`);
  assert(typeIs(id, "string"), `Structure ID '${id}' on structure '${structure}' is invalid; must be a string`);
  structureCache.set(structure.GetAttribute<StructureID>("ID")!, structure);
}

export function getStructureByID<T extends Model = Model>(id: StructureID): T {
  return structureCache.get(id) as T;
}

interface DisplayNameOptions {
  readonly uppercase?: boolean;
}

export function getDisplayName(item: Model, { uppercase = true }: DisplayNameOptions = {}): string {
  const name = item.GetAttribute<string>("DisplayName") ?? item.Name;
  return uppercase ? name.upper() : name;
}

export function isItemStackable(itemID: ItemID): boolean;
export function isItemStackable(item: Model): boolean;
export function isItemStackable(item: Model | ItemID): boolean {
  item = typeIs(item, "string") ? getItemByID(item) : item;
  return item.GetAttribute("ToolTier") === undefined;
}