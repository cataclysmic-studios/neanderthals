import { Registry } from "./registry";

export abstract class ContentRegistry extends Registry {
  protected readonly content = new Map<string, Model>;
  protected readonly byName = new Map<string, string>;
}