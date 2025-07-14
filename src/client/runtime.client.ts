import { Flamework } from "@flamework/core";

import { validateItems, validateStructures } from "shared/validation";

try {
  validateItems();
  validateStructures();

  Flamework.addPaths("src/client/controllers");
  Flamework.addPaths("src/client/components");
  Flamework.addPaths("src/client/hook-managers");

  Flamework.ignite();
} catch (e) {
  throw "Issue igniting Flamework: " + e as string;
}