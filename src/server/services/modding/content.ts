import { Flamework, Service } from "@flamework/core";
import { HttpService, InsertService } from "@rbxts/services";

import { getRawContents } from "./utility";
import type { Mod, ModFolder } from "shared/structs/mod";
import type { ImplementableDescriptor, ModManifest } from "shared/structs/mod-manifest";

import type { MainModdingAPIService } from "./api/main";

declare function loadstring<Fn extends Callback = Callback>(source: string, chunkName?: string): Fn;

type Implementation = (id: string, mainAPI: MainModdingAPIService) => void;

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

function hasImplementation(obj: ImplementableDescriptor): obj is ImplementableDescriptor & { readonly implementation: string } {
  return "implementation" in obj;
}

@Service()
export class ModContentService {
  public constructor(
    private readonly mainModdingAPI: MainModdingAPIService
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

  public async loadImplementation(mod: Mod, descriptor: ImplementableDescriptor): Promise<void> {
    if (!hasImplementation(descriptor)) return;

    const implementationSource = await getRawContents(mod, descriptor.implementation);
    const implementation = loadstring<() => Implementation>(implementationSource, mod.manifest.metadata.id)();
    if (!implementation)
      return warn(`Failed to load implementation for content "${descriptor.id}": ${descriptor.implementation}`);

    implementation(descriptor.id, this.mainModdingAPI);
    print(`Registered implementation for content "${descriptor.id}": ${descriptor.implementation}`);
  }

  public createFolder(manifest: ModManifest): ModFolder {
    const folder = new Instance("Folder")
    folder.Name = manifest.metadata.name + "@" + manifest.metadata.version;

    const assetsFolder = new Instance("Folder", folder);
    assetsFolder.Name = "assets";

    return folder as never;
  }
}