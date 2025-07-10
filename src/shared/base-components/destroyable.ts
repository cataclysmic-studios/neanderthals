import { Component, BaseComponent } from "@flamework/components";
import { Trash } from "@rbxts/trash";

@Component()
export default class DestroyableComponent<A = {}, I extends Instance = Instance> extends BaseComponent<A, I> {
  protected readonly trash = new Trash;

  public destroy(): void {
    const { trash } = this;
    if (trash === undefined || !("destroy" in trash)) return;

    trash.destroy();
    super.destroy();
  }
}