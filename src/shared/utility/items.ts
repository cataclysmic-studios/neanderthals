import { assets } from "../constants";
import { ItemRegistry } from "shared/registry/item-registry";
import type { StructureID } from "shared/structure-id";
import type { ItemID } from "shared/item-id";

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
  item = typeIs(item, "string") ? ItemRegistry.get(item) : item;
  return item.GetAttribute("ToolTier") === undefined;
}