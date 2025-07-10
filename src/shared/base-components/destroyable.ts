import { Component, BaseComponent, Components } from "@flamework/components";
import { getIdFromSpecifier } from "@flamework/components/out/utility";
import { Dependency } from "@flamework/core";
import { Trash } from "@rbxts/trash";

@Component()
export default class DestroyableComponent<A = {}, I extends Instance = Instance> extends BaseComponent<A, I> {
  protected readonly trash = new Trash;

  public destroy(): void {
    const { trash } = this;
    if (trash === undefined || !("destroy" in trash)) return;

    const components = Dependency<Components>();
    const id = getIdFromSpecifier(getmetatable(this) as never);
    trash.destroy();
    components.removeComponent(this.instance, id);
  }
}