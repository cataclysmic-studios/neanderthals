import { Flamework } from "@flamework/core";

try {
  Flamework.addPaths("src/client/controllers");
  Flamework.ignite();
} catch (e) {
  throw "Issue igniting Flamework: " + e as string;
}