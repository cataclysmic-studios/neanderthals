import type { OnStart } from "@flamework/core";
import { Component, BaseComponent } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";
import { $nameof } from "rbxts-transform-debug";

import type { StructureInventoryService } from "server/services/structure-inventory";

interface Attributes {
  readonly PlacementID: number;
}

@Component({
  tag: $nameof<StructureInventory>(),
  ancestorWhitelist: [World.PlacedStructures, World.StackableStructures]
})
export class StructureInventory extends BaseComponent<Attributes> implements OnStart {
  public constructor(
    private readonly structureInventory: StructureInventoryService
  ) { super(); }

  public onStart(): void {
    const id = this.attributes.PlacementID;
    this.structureInventory.create(id);
  }
}