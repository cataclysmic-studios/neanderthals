import { Flamework, Service } from "@flamework/core";
import { HttpService, InsertService } from "@rbxts/services";

import { getRawContents } from "./utility";
import { ImplementationKind } from "shared/structs/mod-manifest";
import type { Mod } from "shared/structs/mod";
import type { Implementation, ModdingAPI } from "./api";
import type { ImplementableDescriptor, ModManifest } from "shared/structs/mod-manifest";

import type { ConsumableModdingAPIService } from "./api/consumable";
import type { StructureModdingAPIService } from "./api/structure";

declare function loadstring<Fn extends Callback = Callback>(source: string, chunkName?: string): Fn;

interface AssetManifest {
  readonly assetID: number;
}

const ASSETS_TO_COLLECT = ["resources", "consumables", "tools", "naturalStructures", "structures"] as const
const assetManifestGuard = Flamework.createGuard<AssetManifest>();

function getAssetName(path: string): string {
  const [name] = path.match("([^/\\]+)%.json$");
  return tostring(name!);
}

function collectAssets(manifest: ModManifest): Set<string> {
  const assets = new Set<string>;
  for (const kind of ASSETS_TO_COLLECT) {
    if (!(kind in manifest)) continue;
    for (const content of manifest[kind]!) {
      assets.add(content.model);
    }
  }

  return assets;
}

@Service()
export class ModContentService {
  public constructor(
    private readonly consumableModdingAPI: ConsumableModdingAPIService,
    private readonly structureModdingAPI: StructureModdingAPIService
  ) { }

  public async downloadAssets(mod: Mod): Promise<void> {
    print("Downloading assets for", mod.manifest.metadata.id + "@" + mod.manifest.metadata.version);
    const assetPaths = collectAssets(mod.manifest);
    for (const path of assetPaths) {
      const content = await getRawContents(mod, path);
      const manifest = HttpService.JSONDecode(content);
      const errorMessage = "Failed to load mod asset: " + path;
      if (!assetManifestGuard(manifest)) {
        return error(errorMessage)
      }

      const { assetID } = manifest;
      const [asset] = InsertService.LoadAsset(assetID).GetChildren();
      asset.Name = getAssetName(path);
      asset.Parent = mod.folder.assets;
      print("Loaded", path);
    }
  }

  public getAsset<T extends Instance = Instance>(mod: Mod, path: string): T {
    const asset = mod.folder.assets.FindFirstChild<T>(getAssetName(path));
    assert(asset !== undefined, "Could not find mod asset: " + path);

    return asset;
  }

  public async loadImplementation<Kind extends ImplementationKind, T extends ImplementableDescriptor<Kind>>(
    mod: Mod,
    descriptor: T
  ): Promise<void> {
    if (!this.hasImplementation(descriptor)) return;

    const implementationSource = await getRawContents(mod, descriptor.implementation);
    const api = this.getAPI(descriptor.implementationKind);
    const implementation = loadstring<() => Implementation<Kind>>(implementationSource, mod.manifest.metadata.id)();
    if (!implementation)
      return warn(`Failed to load implementation for content "${descriptor.id}": ${descriptor.implementation}`);

    implementation(descriptor.id, api);
    print(`Registered ${descriptor.implementationKind} implementation for content "${descriptor.id}": ${descriptor.implementation}`);
  }

  private getAPI<Kind extends ImplementationKind>(kind: Kind): ModdingAPI<Kind> {
    switch (kind) {
      case ImplementationKind.Consumable:
        return this.consumableModdingAPI as never;
      case ImplementationKind.Structure:
        return this.structureModdingAPI as never;

      default:
        return undefined!;
    }
  }

  private hasImplementation<Kind extends ImplementationKind, T extends ImplementableDescriptor<Kind>>(
    obj: T
  ): obj is T & Required<ImplementableDescriptor<Kind>> {
    return "implementationKind" in obj && "implementation" in obj;
  }
}