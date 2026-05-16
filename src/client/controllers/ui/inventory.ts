import { Trash } from "@rbxts/trash";

import { assets } from "shared/constants";
import { isItemStackable } from "shared/utility/items";
import { addViewportItem } from "client/utility";
import { IDRegistry } from "shared/registry/id-registry";
import { ItemRegistry } from "shared/registry/item-registry";

import type { HoverInfoUIController } from "./hover-info";
import { createDiff } from "@rbxts/diff";

interface ItemFrameInfo {
  readonly button: ItemButton;
  readonly trash: Trash;
}

type MainFrameName = ExtractKeys<PlayerGui["Main"], Frame & {
  Content: ScrollingFrame;
}>;

export abstract class InventoryUIController<K extends MainFrameName = MainFrameName> {
  protected readonly buttonInfos = new Map<string, ItemFrameInfo>;
  protected readonly itemContainer: ScrollingFrame;

  private lastInventory = new Map<number, number>;

  public constructor(
    protected readonly frame: PlayerGui["Main"][K],
    private readonly hoverInfo: HoverInfoUIController
  ) {
    this.itemContainer = frame.Content;
  }

  protected abstract onItemClick(id: string): void;
  protected abstract onItemRightClick(id: string): void;

  protected deleteItemButton(id: string): void {
    this.buttonInfos.get(id)?.trash.destroy();
    this.buttonInfos.delete(id);
  }

  protected createItemButton(id: string, count: number): ItemButton {
    const itemTemplate = ItemRegistry.get(id);
    const trash = new Trash;
    const button = assets.UI.InventoryItem.Clone();
    trash.linkToInstance(button);
    addViewportItem(button.Viewport, id);

    const info = { button, trash };
    button.Name = itemTemplate.Name;
    button.Count.Text = tostring(count);
    this.handleButtonEvents(id, info);
    button.Parent = this.itemContainer;

    this.buttonInfos.set(id, info);
    return button;
  }

  private handleButtonEvents(id: string, { button, trash }: ItemFrameInfo) {
    const itemTemplate = ItemRegistry.get(id);
    const { hoverInfo } = this;
    trash.add(button.MouseButton1Click.Connect(() => this.onItemClick(id)));
    trash.add(button.MouseButton2Click.Connect(() => this.onItemRightClick(id)));
    trash.add(button.MouseEnter.Connect((x, y) => {
      hoverInfo.updatePosition(x, y);
      hoverInfo.enable(itemTemplate);
    }));
    trash.add(button.MouseLeave.Connect(() => hoverInfo.disable()));
    trash.add(button.MouseMoved.Connect((x, y) => hoverInfo.updatePosition(x, y)));
    trash.add(() => {
      if (hoverInfo.getCurrent() !== itemTemplate) return;
      hoverInfo.disable();
    });
  }

  protected update(newInventory: Map<number, number>): void {
    const { changed, removed } = createDiff(this.lastInventory, newInventory);
    this.lastInventory = newInventory;

    if (removed) {
      task.spawn(() => {
        for (const [index, isRemoved] of removed) {
          if (!isRemoved) continue;
          const id = IDRegistry.getID(index);
          if (!this.buttonInfos.has(id)) continue;
          this.deleteItemButton(id);
        }
      });
    }
    if (changed) {
      for (const [index, diff] of changed) {
        const id = IDRegistry.getID(index);
        const item = ItemRegistry.get(id);
        const info = this.buttonInfos.get(id);
        if (info && isItemStackable(item)) {
          info.button.Count.Text = tostring(diff);
          continue;
        }

        this.createItemButton(id, diff);
      }
    }
  }
}