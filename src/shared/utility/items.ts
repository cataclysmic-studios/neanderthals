import { assets } from "../constants";

const items = assets.Items.GetChildren() as Model[];
const itemCache = new Map<number, Model>;
for (const item of items)
  itemCache.set(item.GetAttribute<number>("ID")!, item);

export function getItemByID<T extends Model = Model>(id: number): Maybe<T> {
  return itemCache.get(id) as T;
}

export function getItemDisplayName(item: Model): string {
  return (item.GetAttribute<string>("DisplayName") ?? item.Name).upper()
}
