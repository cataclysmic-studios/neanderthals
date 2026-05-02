import { CraftingRecipe } from "shared/structs/crafting-recipe";
import { StructureConfig } from "shared/structs/structure-config";
import { ToolKind } from "shared/structs/tool-kind";
import { I } from "ts-toolbelt";

interface JsonVector {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

interface JsonCFrame {
  readonly position: JsonVector;
  readonly rotation: JsonVector;
}

export interface ModMetadata {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly authors: string[];
}

export interface ContentDescriptor {
  readonly model: string;
  readonly id: string;
  readonly tags?: string[];
}

export interface DisplayableDescriptor extends ContentDescriptor {
  readonly displayName?: string;
  readonly displayOffset?: JsonCFrame;
}

export const enum ImplementationKind {
  Consumable = "consumable",
  Structure = "structure",
}

export type ImplementableDescriptor<Kind extends ImplementationKind> = ContentDescriptor & ({
  readonly implementationKind: Kind;
  readonly implementation: string;
} | {
  readonly implementationKind?: undefined;
  readonly implementation?: undefined;
});

export interface NaturalStructureDescriptor extends ContentDescriptor, StructureConfig {

}

export type StructureDescriptor = ImplementableDescriptor<ImplementationKind.Structure> & DisplayableDescriptor & StructureConfig;

export interface ItemDescriptor extends DisplayableDescriptor {
  readonly bagSpace: number;
}

interface RawItemDescriptor extends ItemDescriptor {
  readonly cookSpeed: number;
  readonly cookedVariant: string;
}

type ConsumableDescriptor = ImplementableDescriptor<ImplementationKind.Consumable> & ItemDescriptor & {
  readonly healthGiven?: number;
  readonly hungerGiven?: number;
};

type RawConsumableDescriptor = ConsumableDescriptor & RawItemDescriptor;

interface ToolDescriptor extends ItemDescriptor {
  readonly tier: number;
  readonly entityDamage: number;
  readonly structureDamage: number;
  readonly toolKind?: ToolKind;
}

export interface ModManifest {
  readonly metadata: ModMetadata;
  readonly recipes?: CraftingRecipe[];
  readonly resources?: (ItemDescriptor | RawItemDescriptor)[];
  readonly consumables?: (ConsumableDescriptor | RawConsumableDescriptor)[];
  readonly tools?: ToolDescriptor[];
  readonly naturalStructures?: NaturalStructureDescriptor[];
  readonly structures?: StructureDescriptor[];
}