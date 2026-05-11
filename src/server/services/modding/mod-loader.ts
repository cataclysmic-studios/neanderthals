import { Flamework, Service, type OnStart } from "@flamework/core";
import { HttpService, Players } from "@rbxts/services";
import Signal from "@rbxts/lemon-signal";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import { validateItems, validateStructures } from "shared/validation";
import { getRawContents } from "./utility";
import { ItemRegistry } from "shared/registry/item-registry";
import { StructureRegistry } from "shared/registry/structure-registry";
import { RecipeRegistry } from "shared/registry/recipe-registry";
import type { Mod, ModRepo } from "shared/structs/mod";
import type { ContentDescriptor, DisplayableDescriptor, ItemDescriptor, ModManifest, StructureDescriptor } from "shared/structs/mod-manifest";

import type { ModContentService } from "./content";
import type { ModRulesService } from "./rules";
import { getRecipeYieldID } from "shared/utility/items";
import { IDRegistry } from "shared/registry/id-registry";

type ModList = readonly (ModRepo | [repo: ModRepo, branch: string])[];

const manifestGuard = Flamework.createGuard<ModManifest>();

@Service()
export class ModLoaderService implements OnStart {
  private readonly loadedMods = new Map<string, Mod>;

  public constructor(
    private readonly content: ModContentService,
    private readonly rules: ModRulesService
  ) { }

  public onStart(): void {
    // "R-unic/create-mod"
    this.loadMods([]);
  }

  public async loadMods(modList: ModList): Promise<void> {
    print("Loading mods...");
    print("Mod list:", modList);
    const loadedPlayers = new Set<Player>;
    const loaded = new Signal<(player: Player) => void>;
    messaging.server.on(Message.ReadyForContent, player => {
      loaded.Fire(player);
      loadedPlayers.add(player);
    });
    for (const mod of modList) {
      const repo = typeIs(mod, "string") ? mod : mod[0];
      const branch = typeIs(mod, "string") ? "master" : mod[1];
      await this.loadGitHub(repo, branch);
    }

    // sync modded content for players
    const recipes = RecipeRegistry.getAll();
    loaded.Connect(player => {
      if (loadedPlayers.has(player)) return;
      messaging.client.emit(player, Message.SyncContent, recipes);
    });
    messaging.client.emit([...loadedPlayers], Message.SyncContent, recipes);
    IDRegistry.load();
    print(`Finished loading ${modList.size()} mod(s)!`);
  }

  private async loadGitHub(repo: ModRepo, branch = "master"): Promise<void> {
    print("Loading mod from GitHub:", repo + "@" + branch);
    const manifestJSON = await getRawContents(repo, branch, "manifest.json");
    const manifest = HttpService.JSONDecode(manifestJSON);
    if (!manifestGuard(manifest)) {
      return error("Failed to load mod: invalid mod JSON");
    }

    print(`Loading mod ${manifest.metadata.id}@${manifest.metadata.version}`);
    print("Manifest:", manifest);

    const folder = this.content.createFolder(manifest);
    const mod: Mod = { repo, branch, folder, manifest };
    await this.content.downloadAssets(mod);
    this.registerAllModContent(mod);
    this.loadedMods.set(manifest.metadata.id, mod);
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
      const model = this.content.getAsset<Model>(mod, descriptor.model);
      model.SetAttribute("Consumable", true);

      if (descriptor.healthGiven !== undefined) {
        model.SetAttribute("HealthWhenConsumed", descriptor.healthGiven);
      }
      if (descriptor.hungerGiven !== undefined) {
        model.SetAttribute("HungerWhenConsumed", descriptor.hungerGiven);
      }
      if ("cookSpeed" in descriptor) {
        model.SetAttribute("CanCook", true);
        model.SetAttribute("CookSpeed", descriptor.cookSpeed);
        model.SetAttribute("CookedVariant", descriptor.cookedVariant);
      }

      this.registerItem(model, descriptor);
      this.content.loadImplementation(mod, descriptor);
    }
  }

  private registerStructures(mod: Mod): void {
    if (!mod.manifest.structures) return;
    for (const descriptor of mod.manifest.structures) {
      const model = this.content.getAsset<Model>(mod, descriptor.model);
      model.AddTag("Structure");

      this.registerStructure(model, descriptor);
      this.content.loadImplementation(mod, descriptor);
    }
  }

  private registerRecipes(mod: Mod): void {
    if (!mod.manifest.recipes) return;
    for (const recipe of mod.manifest.recipes) {
      const isCircular = recipe.ingredients.some(([id]) => id === getRecipeYieldID(recipe));
      if (this.rules.current.noCircularRecipes && isCircular) {
        warn("Recipe is circular and current mod rules do not allow for circular recipes:", recipe);
        continue;
      }

      RecipeRegistry.register(recipe);
      print("Registered recipe:", recipe);
    }
    RecipeRegistry.sort();
  }

  private registerItem(model: Model, descriptor: ItemDescriptor): void {
    this.registerDisplayable(model, descriptor);
    model.SetAttribute("BagSpace", descriptor.bagSpace);
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
}