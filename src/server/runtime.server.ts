import { Flamework } from "@flamework/core";

try {
  Flamework.addPaths("src/server/services");
  Flamework.ignite();
} catch (e) {
  throw "Issue igniting Flamework: " + e as string;
}