import type { ImplementationKind } from "shared/structs/mod-manifest";

import type { ConsumableModdingAPIService } from "./consumable";
import type { StructureModdingAPIService } from "./structure";

interface APIMap {
  [ImplementationKind.Consumable]: ConsumableModdingAPIService;
  [ImplementationKind.Structure]: StructureModdingAPIService;
}

export type ModdingAPI<Kind extends ImplementationKind> = APIMap[Kind];

export type Implementation<Kind extends ImplementationKind> = (id: string, api: ModdingAPI<Kind>) => void;