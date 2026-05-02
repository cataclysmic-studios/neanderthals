import { ItemRegistry } from "shared/registry/item-registry";

interface DisplayNameOptions {
  readonly uppercase?: boolean;
}

export function getDisplayName(item: Model, { uppercase = true }: DisplayNameOptions = {}): string {
  const name = item.GetAttribute<string>("DisplayName") ?? item.Name;
  return uppercase ? name.upper() : name;
}

export function isItemStackable(itemID: string): boolean;
export function isItemStackable(item: Model): boolean;
export function isItemStackable(item: Model | string): boolean {
  item = typeIs(item, "string") ? ItemRegistry.get(item) : item;
  return item.GetAttribute("ToolTier") === undefined;
}