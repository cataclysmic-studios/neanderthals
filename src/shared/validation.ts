import { assets } from "./constants";
import { getDisplayName } from "./utility/items";

export function validateItems(): void {
  const errors: string[] = [];
  for (const item of assets.Items.GetChildren()) {
    const itemName = getDisplayName(item as never);
    const isModel = item.IsA("Model");
    if (!isModel)
      errors.push(`Item '${itemName}' is not a model`);

    if (item.GetAttribute("ID") === undefined)
      errors.push(`Item '${itemName}' has no ID`);

    if (isModel && !item.PrimaryPart)
      errors.push(`Item '${itemName}' has no primary part`);
  }

  if (errors.size() === 0) return;
  throw errors.join("\n");
}

export function validateStructures(): void {
  const errors: string[] = [];
  for (const structure of assets.Structures.GetChildren()) {
    const structureName = getDisplayName(structure as never);
    const isModel = structure.IsA("Model");
    if (!isModel)
      errors.push(`Structure '${structureName}' is not a model`);

    if (structure.GetAttribute("ID") === undefined)
      errors.push(`Structure '${structureName}' has no ID`);

    if (isModel && !structure.PrimaryPart)
      errors.push(`Structure '${structureName}' has no primary part`);
  }

  if (errors.size() === 0) return;
  throw errors.join("\n");
}