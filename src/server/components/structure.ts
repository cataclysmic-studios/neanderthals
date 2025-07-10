import type { OnStart } from "@flamework/core";
import { BaseComponent, Component } from "@flamework/components";
import { Trash } from "@rbxts/trash";
import { getDescendantsOfType } from "@rbxts/instance-utility";
import { $nameof } from "rbxts-transform-debug";

interface Attributes {
  readonly Structure_RespawnTime: number;
}

@Component({
  tag: $nameof<Structure>(),
  defaults: {
    Structure_RespawnTime: 60
  }
})
export class Structure extends BaseComponent<Attributes, StructureModel> implements OnStart {
  private readonly trash = new Trash;
  private readonly parts = getDescendantsOfType(this.instance, "BasePart");
  private readonly originalCollisions = new Map<BasePart, boolean>;
  private alive = false;

  public onStart(): void {
    for (const part of this.parts)
      this.originalCollisions.set(part, part.CanCollide);

    this.spawn(false);
  }

  private kill(): void {
    if (!this.alive) return;
    this.alive = false;
    this.trash.purge();
    this.toggleVisibility(false);
  }

  private spawn(toggleVisiblity = true): void {
    if (this.alive) return;

    const { instance, trash } = this;
    this.alive = true;

    const humanoid = instance.Humanoid;
    trash.add(humanoid.GetPropertyChangedSignal("Health").Connect(() => {
      if (humanoid.Health > 0) return;
      this.kill();
    }));

    if (toggleVisiblity)
      this.toggleVisibility(true);
  }

  private toggleVisibility(on: boolean): void {
    for (const part of this.parts) {
      part.Transparency = on ? 0 : 1;
      part.CanCollide = on ? this.originalCollisions.get(part)! : false;
      part.CanQuery = on;
      part.CanTouch = on;
    }
  }
}