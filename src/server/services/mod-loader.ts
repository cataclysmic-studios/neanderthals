import { Flamework, type OnStart, Service } from "@flamework/core";
import { HttpService, InsertService } from "@rbxts/services";

import { assets } from "shared/constants";
import { validateItems, validateStructures } from "shared/validation";
import { ItemRegistry } from "shared/registry/item-registry";
import type { ItemDescriptor, ModManifest } from "shared/structs/mod-manifest";

type ModRepo = `${string}/${string}`;

const BASE_URL = "https://raw.githubusercontent.com/"
const ASSETS_TO_COLLECT = ["resources", "consumables", "tools", "naturalStructures", "structures"] as const
const modGuard = Flamework.createGuard<ModManifest>();

interface ModFolder {
  readonly assets: Folder;
}

interface AssetManifest {
  readonly assetID: number;
}

interface Mod {
  readonly repo: ModRepo;
  readonly branch: string;
  readonly folder: ModFolder;
  readonly manifest: ModManifest;
}

function getAssetName(path: string): string {
  const [name] = path.match("([^/\\]+)%.json$");
  return tostring(name!);
}

const assetManifestGuard = Flamework.createGuard<AssetManifest>();
@Service()
export class ModLoaderService implements OnStart {
  private readonly loaded = new Map<string, Mod>;

  public onStart(): void {
    this.loadGitHub("R-unic/fish-mod-example");
  }

  public async loadGitHub(repo: ModRepo, branch = "master"): Promise<void> {
    print("Loading mod from GitHub:", repo + "@" + branch);
    const manifestJSON = await this.getRawContents(repo, branch, "manifest.json");
    const manifest = this.loadManifest(manifestJSON);
    print(`Loading mod ${manifest.metadata.id}@${manifest.metadata.version} by ${manifest.metadata.authors.join(", ")}`);

    const folder = this.createFolder(manifest);
    const mod: Mod = { repo, branch, folder, manifest };
    await this.downloadAssets(mod);
    this.registerContent(mod);
    this.loaded.set(manifest.metadata.id, mod);
  }

  private registerContent(mod: Mod): void {
    this.registerConsumables(mod);
    validateItems();
    validateStructures();
  }

  private registerConsumables(mod: Mod): void {
    if (!mod.manifest.consumables) return;
    for (const descriptor of mod.manifest.consumables) {
      const model = this.getAsset<Model>(mod, descriptor.model);
      model.SetAttribute("Food", true);

      if (descriptor.healthGiven !== undefined) {
        model.SetAttribute("HealthWhenEaten", descriptor.healthGiven);
      }
      if (descriptor.hungerGiven !== undefined) {
        model.SetAttribute("HungerWhenEaten", descriptor.hungerGiven);
      }
      if ("cookSpeed" in descriptor) {
        model.SetAttribute("CanCook", true);
        model.SetAttribute("CookSpeed", descriptor.cookSpeed);
        model.SetAttribute("CookedVariant", descriptor.cookedVariant);
      }

      this.registerItem(model, descriptor);
    }
  }

  private registerItem(model: Model, descriptor: ItemDescriptor): void {
    model.SetAttribute("ID", descriptor.id);
    model.SetAttribute("BagSpace", descriptor.bagSpace);
    if (descriptor.displayName !== undefined) {
      model.SetAttribute("DisplayName", descriptor.displayName);
    }
    if (descriptor.displayOffset !== undefined) {
      const p = descriptor.displayOffset.position;
      const r = descriptor.displayOffset.rotation;
      const position = new Vector3(p.x, p.y, p.z);
      const rotation = new Vector3(r.x, r.y, r.z).mul(math.pi / 180);
      const cframe = new CFrame(position)
        .mul(CFrame.fromEulerAnglesXYZ(rotation.X, rotation.Y, rotation.Z));

      model.SetAttribute("DisplayOffset", cframe);
    }

    model.Parent = assets.Items;
    ItemRegistry.register(model);
  }

  private loadManifest(json: string): ModManifest {
    const manifest = HttpService.JSONDecode(json);
    if (!modGuard(manifest)) {
      return error("Failed to load mod: invalid mod JSON");
    }

    return manifest;
  }

  private createFolder(manifest: ModManifest): ModFolder {
    const folder = new Instance("Folder")
    folder.Name = manifest.metadata.name + "@" + manifest.metadata.version;

    const assetsFolder = new Instance("Folder", folder);
    assetsFolder.Name = "assets";

    return folder as never;
  }

  private async downloadAssets(mod: Mod): Promise<void> {
    print("Downloading assets for", mod.manifest.metadata.id + "@" + mod.manifest.metadata.version);
    const assetPaths = this.collectAssets(mod.manifest);
    for (const path of assetPaths) {
      const content = await this.getRawContents(mod, path);
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

  private collectAssets(manifest: ModManifest): Set<string> {
    const assets = new Set<string>;
    for (const kind of ASSETS_TO_COLLECT) {
      if (!(kind in manifest)) continue;
      for (const content of manifest[kind]!) {
        assets.add(content.model);
      }
    }

    return assets;
  }

  private async getRawContents(repo: ModRepo, branch: string, path: string): Promise<string>;
  private async getRawContents(mod: Mod, path: string): Promise<string>;
  private async getRawContents(a: ModRepo | Mod, b: string, c?: string): Promise<string> {
    const repo = typeIs(a, "string") ? a : a.repo;
    const branch = typeIs(a, "string") ? b : a.branch;
    const path = typeIs(c, "string") ? c : b;

    return new Promise((resolve, reject) => {
      try {
        const url = BASE_URL + repo + "/refs/heads/" + branch + "/" + path;
        const content = HttpService.GetAsync(url, true);
        resolve(content);
      } catch (e) {
        reject(e);
      }
    })
  }

  private getAsset<T extends Instance = Instance>(mod: Mod, path: string): T {
    const asset = mod.folder.assets.FindFirstChild<T>(getAssetName(path));
    assert(asset !== undefined, "Could not find mod asset: " + path);

    return asset;
  }
}