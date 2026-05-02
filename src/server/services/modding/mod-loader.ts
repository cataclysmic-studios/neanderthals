import { Flamework, type OnStart, Service } from "@flamework/core";
import { HttpService, InsertService, Players } from "@rbxts/services";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import { validateItems, validateStructures } from "shared/validation";
import { ImplementationKind } from "shared/structs/mod-manifest";
import { ItemRegistry } from "shared/registry/item-registry";
import { StructureRegistry } from "shared/registry/structure-registry";
import { RecipeRegistry } from "shared/registry/recipe-registry";
import type { Implementation, ModdingAPI } from "./api";
import type { ContentDescriptor, DisplayableDescriptor, ImplementableDescriptor, ItemDescriptor, ModManifest, StructureDescriptor } from "shared/structs/mod-manifest";

import type { ConsumableModdingAPIService } from "./api/consumable";
import type { StructureModdingAPIService } from "./api/structure";

const BASE_URL = "https://raw.githubusercontent.com/"
const ASSETS_TO_COLLECT = ["resources", "consumables", "tools", "naturalStructures", "structures"] as const
const modGuard = Flamework.createGuard<ModManifest>();
const assetManifestGuard = Flamework.createGuard<AssetManifest>();

declare function loadstring<Fn extends Callback = Callback>(source: string, chunkName?: string): Fn

type ModRepo = `${string}/${string}`;
type ModList = readonly (ModRepo | [repo: ModRepo, branch: string])[];

interface ModFolder extends Folder {
  readonly assets: Folder;
  readonly impl: Folder;
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

@Service()
export class ModLoaderService implements OnStart {
  private readonly loaded = new Map<string, Mod>;
  private readonly modList: ModList = [
    "R-unic/fish-mod"
  ];

  public constructor(
    private readonly consumableModdingAPI: ConsumableModdingAPIService,
    private readonly structureModdingAPI: StructureModdingAPIService
  ) { }

  public async onStart(): Promise<void> {
    print("Loading mods...");
    print("Mod list:", this.modList);
    for (const mod of this.modList) {
      const repo = typeIs(mod, "string") ? mod : mod[0];
      const branch = typeIs(mod, "string") ? "master" : mod[1];
      await this.loadGitHub(repo, branch);
    }

    // sync modded recipes every time a player joins
    messaging.client.emitAll(Message.SyncContent, RecipeRegistry.getAll());
    Players.PlayerAdded.Connect(player => {
      messaging.client.emit(player, Message.SyncContent, RecipeRegistry.getAll());
    });
    print(`Finished loading ${this.modList.size()} mod(s)!`);
  }

  private async loadGitHub(repo: ModRepo, branch = "master"): Promise<void> {
    print("Loading mod from GitHub:", repo + "@" + branch);
    const manifestJSON = await this.getRawContents(repo, branch, "manifest.json");
    const manifest = this.loadManifest(manifestJSON);
    print(`Loading mod ${manifest.metadata.id}@${manifest.metadata.version}`);
    print("Manifest:", manifest)

    const folder = this.createFolder(manifest);
    const mod: Mod = { repo, branch, folder, manifest };
    await this.downloadAssets(mod);
    this.registerAllModContent(mod);
    this.loaded.set(manifest.metadata.id, mod);
    print("Finished loading mod " + manifest.metadata.id + "@" + manifest.metadata.version + "!");
  }

  private registerAllModContent(mod: Mod): void {
    this.registerConsumables(mod);
    this.registerStructures(mod);
    this.registerRecipes(mod);
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
      this.registerImplementation(mod, descriptor);
    }
  }

  private registerStructures(mod: Mod): void {
    if (!mod.manifest.structures) return;
    for (const descriptor of mod.manifest.structures) {
      const model = this.getAsset<Model>(mod, descriptor.model);
      model.AddTag("Structure");

      this.registerStructure(model, descriptor);
      this.registerImplementation(mod, descriptor);
    }
  }

  private registerRecipes(mod: Mod): void {
    if (!mod.manifest.recipes) return;
    for (const recipe of mod.manifest.recipes) {
      RecipeRegistry.register(recipe);
      print("Registered recipe:", recipe);
    }
  }

  private registerItem(model: Model, descriptor: ItemDescriptor): void {
    this.registerDisplayable(model, descriptor);
    model.Parent = assets.Items;
    ItemRegistry.register(model);
  }

  private registerStructure(model: Model, descriptor: StructureDescriptor): void {
    this.registerDisplayable(model, descriptor);
    model.Parent = assets.Structures;
    StructureRegistry.register(model);
  }

  private registerDisplayable(model: Model, descriptor: DisplayableDescriptor): void {
    this.registerContent(model, descriptor);

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
  }

  private registerContent(model: Model, descriptor: ContentDescriptor): void {
    model.SetAttribute("ID", descriptor.id);
    if (descriptor.tags !== undefined) {
      for (const tag of descriptor.tags) {
        model.AddTag(tag);
      }
    }
  }

  private async registerImplementation<Kind extends ImplementationKind, T extends ImplementableDescriptor<Kind>>(
    mod: Mod,
    descriptor: T
  ): Promise<void> {
    if (!this.hasImplementation(descriptor)) return;

    const implementationSource = await this.getRawContents(mod, descriptor.implementation);
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