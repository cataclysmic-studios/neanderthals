import { Dependency, Service } from "@flamework/core";

import { hasFlag, Permissions } from "./permissions";
import type { MainModdingAPIService } from "./api/main";

interface ModRules {
  readonly permissions: number;
  readonly noCircularRecipes: boolean;
}

const STANDARD_MOD_RULES: ModRules = {
  permissions: Permissions.ConsumableAPI | Permissions.StructureAPI | Permissions.ItemSpawning,
  noCircularRecipes: true
};

@Service()
export class ModRulesService {
  public readonly current = STANDARD_MOD_RULES;

  public getSandboxedModdingAPI(): MainModdingAPIService {
    const mainModdingAPI = Dependency<MainModdingAPIService>() as DeepWritable<MainModdingAPIService>;
    if (!this.hasPermission(Permissions.Audio)) {
      mainModdingAPI.audio = undefined!;
    }
    if (!this.hasPermission(Permissions.ConsumableAPI)) {
      mainModdingAPI.consumable = undefined!;
    }
    if (!this.hasPermission(Permissions.StructureAPI)) {
      mainModdingAPI.structure = undefined!;
    }
    if (!this.hasPermission(Permissions.ItemSpawning)) {
      mainModdingAPI.spawnItem = undefined!;
    }

    return mainModdingAPI as never;
  }

  private hasPermission(permission: Permissions): boolean {
    return hasFlag(this.current.permissions, Permissions.All) || hasFlag(this.current.permissions, permission);
  }
}