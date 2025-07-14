import { Flamework } from "@flamework/core";

import { validateItems, validateStructures } from "shared/validation";

try {
  validateItems();
  validateStructures();

  Flamework.addPaths("src/server/services");
  Flamework.addPaths("src/server/components");
  Flamework.addPaths("src/server/hook-managers");

  Flamework.ignite();
} catch (e) {
  throw "Issue igniting Flamework: " + e as string;
}