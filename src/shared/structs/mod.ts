import type { ModManifest } from "./mod-manifest";

export type ModRepo = `${string}/${string}`;

export interface ModFolder extends Folder {
  readonly assets: Folder;
  readonly impl: Folder;
}

export interface Mod {
  readonly repo: ModRepo;
  readonly branch: string;
  readonly folder: ModFolder;
  readonly manifest: ModManifest;
}