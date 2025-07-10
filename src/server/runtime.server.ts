import { Flamework } from "@flamework/core";

try {
  Flamework.addPaths("src/server/services");
  Flamework.addPaths("src/server/components");

  Flamework.ignite();
} catch (e) {
  throw "Issue igniting Flamework: " + e as string;
}