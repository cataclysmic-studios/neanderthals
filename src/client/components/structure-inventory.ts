import type { OnStart } from "@flamework/core";
import { Component, BaseComponent } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";
import { $nameof } from "rbxts-transform-debug";
import { StructureInventoryUIController } from "client/controllers/ui/structure-inventory";
import { MainUIController } from "client/controllers/ui/main";

interface Attributes {
  readonly ID: string;
  readonly PlacementID: number;
}

@Component({
  tag: $nameof<StructureInventory>(),
  ancestorWhitelist: [World.PlacedStructures, World.StackableStructures]
})
export class StructureInventory extends BaseComponent<Attributes, StructureModel> implements OnStart {
  public constructor(
    private readonly structureInventoryUI: StructureInventoryUIController
  ) { super(); }

  public onStart(): void {
    const { attributes, structureInventoryUI } = this;
    const id = attributes.ID!;
    const placementID = attributes.PlacementID!;
    const prompt = new Instance("ProximityPrompt");
    prompt.ActionText = "Open";
    prompt.KeyboardKeyCode = Enum.KeyCode.F;
    prompt.Triggered.Connect(() => {
      structureInventoryUI.setStructure(placementID, id);
      structureInventoryUI.toggle(true);
    });
    prompt.Parent = this.instance.PrimaryPart;
  }
}