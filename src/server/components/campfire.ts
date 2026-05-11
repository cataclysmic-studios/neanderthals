import { Component, BaseComponent, type Components } from "@flamework/components";
import { Workspace as World } from "@rbxts/services";
import { getChildrenOfType } from "@rbxts/instance-utility";
import { $nameof } from "rbxts-transform-debug";

import { assets } from "shared/constants";
import { dropItem } from "server/utility";
import { distanceBetween } from "shared/utility";
import { ItemRegistry } from "shared/registry/item-registry";
import type { OnFixed } from "shared/hooks";

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
    const { fuelUI, fuel } = this;
    const hasFuel = fuel > 0;
    this.toggleFX(hasFuel);
    if (!hasFuel) return;

    fuelUI.Bar.Size = UDim2.fromScale(fuel / 100, 1);
    fuelUI.Amount.Text = ceil(fuel) + "%";
    this.addFuel(-dt / 2);

    const droppedItems = this.components.getAllComponents<DroppedItem>();
    for (const droppedItem of droppedItems) {
      this.cookItem(droppedItem, dt);
    }

    const info: { cookedID: GameID, cframe: CFrame; }[] = [];
    for (const item of this.cookedItems) {
      info.push({
        cookedID: item.attributes.CookedVariant!,
        cframe: item.instance.PrimaryPart!.CFrame
      });
      item.destroy();
    }

    for (const { cookedID, cframe } of info)
      dropItem(ItemRegistry.get(cookedID), cframe);

    this.cookedItems = new Set;
  }

  public addFuel(amount: number): void {
    this.fuel = clamp(this.fuel + amount, 0, 100);
  }

  private cookItem(item: DroppedItem, dt: number): void {
    if (!item.attributes.CanCook) return;
    const { cookProgress } = this;

    const itemPosition = item.instance.PrimaryPart!.Position;
    const campfirePosition = this.instance.Hitbox.Position;
    const distance = distanceBetween(campfirePosition, itemPosition);
    if (distance > RANGE) {
      cookProgress.delete(item);
      return item.instance.FindFirstChild("CookProgressUI")?.Destroy();
    }

    const progress = cookProgress.get(item);
    if (progress === undefined) {
      const progressUI = assets.UI.CookProgressUI.Clone();
      progressUI.Progress.Bar.Size = UDim2.fromScale(0, 1);
      progressUI.Parent = item.instance;

      return void cookProgress.set(item, 0);
    }

    const progressUI = item.instance.FindFirstChild<typeof assets.UI.CookProgressUI>("CookProgressUI")!;
    const speed = item.attributes.CookSpeed ?? 0; // dumb
    const amount = dt * speed * (1 / clamp(distance - 6 / RANGE, 0, RANGE));
    const newProgress = progress + amount;
    progressUI.Progress.Bar.Size = UDim2.fromScale(newProgress / 100, 1);
    if (newProgress < 100) {
      return void cookProgress.set(item, newProgress);
    }

    this.cookedItems.add(item);
    cookProgress.delete(item);
  }

  private toggleFX(on: boolean): void {
    if (this.fx[0].Enabled === on) return;
    this.fuelBillboard.Enabled = on;
    for (const fx of this.fx)
      fx.Enabled = on;
  }
}