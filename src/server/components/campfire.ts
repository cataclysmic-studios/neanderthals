import { Component, BaseComponent, type Components } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";
import { $nameof } from "rbxts-transform-debug";

import type { OnFixed } from "shared/hooks";
import { dropItem } from "server/utility";
import { distanceBetween } from "shared/utility";
import { getItemByID } from "shared/utility/items";

import type { DroppedItem } from "./dropped-item";
import { getChildrenOfType } from "@rbxts/instance-utility";

const { clamp, ceil } = math;

const RANGE = 20;

interface CampfireModel extends Model {
  Hitbox: BasePart & {
    FuelGUI: BillboardGui & {
      Fuel: ProgressBarFrame & {
        Amount: TextLabel;
      };
    };
  };
  Base: BasePart & {
    Attachment: Attachment;
  };
}

@Component({
  tag: $nameof<Campfire>(),
  ancestorWhitelist: [World],
  ancestorBlacklist: [World.StructureHolograms]
})
export class Campfire extends BaseComponent<{}, CampfireModel> implements OnFixed {
  private readonly fuelBillboard = this.instance.Hitbox.FuelGUI;
  private readonly fuelUI = this.fuelBillboard.Fuel;
  private readonly fx = getChildrenOfType(this.instance.Base.Attachment, "ParticleEmitter", "Light");
  private readonly cookProgress = new Map<DroppedItem, number>;
  private fuel = 100;

  public constructor(
    private readonly components: Components
  ) {
    super();
    this.fuelBillboard.Enabled = true;
  }

  public onFixed(dt: number): void {
    const { fuelUI, fuel, cookProgress } = this;
    if (fuel <= 0) return;
    fuelUI.Bar.Size = UDim2.fromScale(fuel / 100, 1);
    fuelUI.Amount.Text = ceil(fuel) + "%";
    this.addFuel(-dt / 2);

    const droppedItems = this.components.getAllComponents<DroppedItem>();
    for (const droppedItem of droppedItems) {
      if (!droppedItem.attributes.CanCook) continue;

      const itemPosition = droppedItem.instance.PrimaryPart!.Position;
      const campfirePosition = this.instance.Hitbox.Position;
      const distance = distanceBetween(campfirePosition, itemPosition);
      if (distance > RANGE) {
        cookProgress.delete(droppedItem);
        continue;
      }

      const progress = cookProgress.get(droppedItem);
      if (progress === undefined) {
        cookProgress.set(droppedItem, 0);
        continue;
      }

      const speed = droppedItem.attributes.CookSpeed ?? 0; // dumb
      const amount = dt * speed * (1 / clamp(distance - 6 / RANGE, 0, RANGE));
      const newProgress = progress + amount;
      if (newProgress < 100) {
        cookProgress.set(droppedItem, newProgress);
        continue;
      }

      this.cookItem(droppedItem);
      cookProgress.delete(droppedItem);
    }
  }

  public addFuel(amount: number): void {
    this.fuel = clamp(this.fuel + amount, 0, 100);
  }

  private cookItem(droppedItem: DroppedItem): void {
    const cframe = droppedItem.instance.PrimaryPart!.CFrame;
    droppedItem.destroy();

    const cookedItem = getItemByID(droppedItem.attributes.CookedVariant!)!;
    dropItem(cookedItem, cframe);
  }

  private toggleFX(on: boolean): void {
    for (const fx of this.fx)
      fx.Enabled = on;
  }
}