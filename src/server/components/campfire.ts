import { Component, BaseComponent, type Components } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";
import { getChildrenOfType } from "@rbxts/instance-utility";
import { $nameof } from "rbxts-transform-debug";

import type { OnFixed } from "shared/hooks";
import { assets } from "shared/constants";
import { dropItem } from "server/utility";
import { distanceBetween } from "shared/utility";
import { getItemByID } from "shared/utility/items";

import type { DroppedItem } from "./dropped-item";

const { clamp, ceil } = math;

const RANGE = 20;

interface CampfireModel extends Model {
  Hitbox: BasePart & {
    FuelUI: BillboardGui & {
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
  private readonly fuelBillboard = this.instance.Hitbox.FuelUI;
  private readonly fuelUI = this.fuelBillboard.Fuel;
  private readonly fx = getChildrenOfType(this.instance.Base.Attachment, "ParticleEmitter", "Light");
  private readonly cookProgress = new Map<DroppedItem, number>;
  private cookedItems = new Set<DroppedItem>;
  private fuel = 100;

  public constructor(
    private readonly components: Components
  ) {
    super();
    this.fuelBillboard.Enabled = true;
  }

  public onFixed(dt: number): void {
    const { fuelUI, fuel, cookProgress } = this;
    const hasFuel = fuel > 0;
    this.toggleFX(hasFuel);
    if (!hasFuel) return;

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
        droppedItem.instance.FindFirstChild("CookProgressUI")?.Destroy();
        continue;
      }

      const progress = cookProgress.get(droppedItem);
      if (progress === undefined) {
        const progressUI = assets.UI.CookProgressUI.Clone();
        progressUI.Progress.Bar.Size = UDim2.fromScale(0, 1);
        progressUI.Parent = droppedItem.instance;

        cookProgress.set(droppedItem, 0);
        continue;
      }

      const progressUI = droppedItem.instance.FindFirstChild<typeof assets.UI.CookProgressUI>("CookProgressUI")!;
      const speed = droppedItem.attributes.CookSpeed ?? 0; // dumb
      const amount = dt * speed * (1 / clamp(distance - 6 / RANGE, 0, RANGE));
      const newProgress = progress + amount;
      progressUI.Progress.Bar.Size = UDim2.fromScale(newProgress / 100, 1);
      if (newProgress < 100) {
        cookProgress.set(droppedItem, newProgress);
        continue;
      }

      this.cookedItems.add(droppedItem);
      cookProgress.delete(droppedItem);
    }

    // destroy all raw items before spawning cooked items to prevent any ID collision
    const info: { cookedID: number, cframe: CFrame }[] = [];
    for (const item of this.cookedItems) {
      info.push({
        cookedID: item.attributes.CookedVariant!,
        cframe: item.instance.PrimaryPart!.CFrame
      });
      item.destroy();
    }

    for (const { cookedID, cframe } of info)
      dropItem(getItemByID(cookedID)!, cframe);

    this.cookedItems = new Set;
  }

  public addFuel(amount: number): void {
    this.fuel = clamp(this.fuel + amount, 0, 100);
  }

  private toggleFX(on: boolean): void {
    if (this.fx[0].Enabled === on) return;
    this.fuelBillboard.Enabled = on;
    for (const fx of this.fx)
      fx.Enabled = on;
  }
}