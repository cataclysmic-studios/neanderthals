import { CraftingRecipe } from "shared/structs/crafting-recipe";
import { StructureConfig } from "shared/structs/structure-config";
import { ToolKind } from "shared/structs/tool-kind";

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

interface ContentDescriptor {
  readonly model: string;
  readonly id: string;
}

export interface DisplayableDescriptor extends ContentDescriptor {
  readonly displayName?: string;
  readonly displayOffset?: JsonCFrame;
}

export interface NaturalStructureDescriptor extends ContentDescriptor, StructureConfig {

}

export interface StructureDescriptor extends DisplayableDescriptor, StructureConfig {

}

export interface ItemDescriptor extends DisplayableDescriptor {
  readonly bagSpace: number;
}

interface RawItemDescriptor extends ItemDescriptor {
  readonly cookSpeed: number;
  readonly cookedVariant: string;
}

interface ConsumableDescriptor extends ItemDescriptor {
  readonly healthGiven?: number;
  readonly hungerGiven?: number;
}

interface RawConsumableDescriptor extends ConsumableDescriptor, RawItemDescriptor {

}

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