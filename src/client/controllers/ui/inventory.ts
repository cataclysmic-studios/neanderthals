import { Controller } from "@flamework/core";
import { Trash } from "@rbxts/trash";
import { TweenBuilder } from "@rbxts/twin";
import Signal from "@rbxts/lemon-signal";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import { mainScreen } from "client/constants";
import { recordDiff } from "shared/utility";
import { getDisplayName, isItemStackable } from "shared/utility/items";
import { addViewportItem } from "client/utility";
import { INITIAL_DATA } from "shared/structs/player-data";
import { EXCLUSIVE_IDS } from "shared/item-id";
import { ItemRegistry } from "shared/registry/item-registry";

import type { ReplicaController } from "../replica";
import type { InputController } from "../input";
import type { CharacterController } from "../character";
import type { HotbarUIController } from "./hotbar";

interface ItemFrameInfo {
  readonly button: ItemButton;
  readonly trash: Trash;
}

const DROP_OFFSET = vector.create(0, 1.5, 0);
const HOVER_INFO_FADE_DURATION = 0.1;

@Controller()
export class InventoryUIController {
  public readonly toggled = new Signal<(on: boolean) => void>;

  private readonly hoverInfo = mainScreen.HoverInfo;
  private readonly baseHoverInfoPosition = this.hoverInfo.Position;
  private readonly frame: PlayerGui["Main"]["Inventory"];
  private readonly itemContainer: ScrollingFrame;
  private readonly buttonInfos = new Map<string, ItemFrameInfo>;
  private lastInventory = INITIAL_DATA.inventory;

  public constructor(
    replica: ReplicaController,
    input: InputController,
    private readonly character: CharacterController,
    private readonly hotbar: HotbarUIController
  ) {
    const frame = this.frame = mainScreen.Inventory;
    this.itemContainer = frame.Content;

    input.onKeyDown(Enum.KeyCode.B, () => this.toggle());
    replica.updated.Connect(data => {
      const last = this.lastInventory;
      let changes = recordDiff(data.inventory, last);
      for (const [id, count] of pairs(changes)) {
        const lastCount = last.get(id) ?? 0;
        const countDiff = count - lastCount;
        changes[id] = countDiff;
      }

      const deletionsRecord = recordDiff(last, data.inventory, false);
      const deletions = new Set<string>;
      for (const [id] of pairs(deletionsRecord))
        deletions.add(id);

      this.update(changes, deletions);
      this.lastInventory = data.inventory;
    });
  }

  public toggle(on = !this.frame.Visible): void {
    if (this.frame.Visible === on) return;
    this.frame.Visible = on;
    this.toggled.Fire(on);
  }

  public isEnabled(): boolean {
    return this.frame.Visible;
  }

  private update(changes: Record<string, Maybe<number>>, deletions: Set<string>): void {
    for (const [id, diff] of pairs(changes)) {
      const info = this.buttonInfos.get(id);
      if (info && isItemStackable(id)) {
        const currentCount = this.lastInventory.get(id) ?? 0;
        info.button.Count.Text = tostring(currentCount + (diff as number));
        continue;
      }

      this.createItemButton(id, diff as number);
    }

    for (const id of deletions) {
      if (!this.buttonInfos.has(id)) continue;
      this.deleteItemButton(id);
    }
  }

  private deleteItemButton(id: string): void {
    this.buttonInfos.get(id)?.trash.destroy();
    this.buttonInfos.delete(id);
  }

  private createItemButton(id: string, count: number): ItemButton {
    const itemTemplate = ItemRegistry.get(id);
    const trash = new Trash;
    const button = assets.UI.InventoryItem.Clone();
    trash.linkToInstance(button);
    addViewportItem(button.Viewport, id);

    const isConsumable = itemTemplate.GetAttribute<boolean>("Consumable") ?? false;
    const isTool = itemTemplate.GetAttribute("ToolTier") !== undefined;
    const canDrop = !EXCLUSIVE_IDS.has(id);
    button.Name = itemTemplate.Name;
    button.Count.Text = tostring(count);
    trash.add(button.MouseButton1Click.Connect(() => {
      if (isConsumable)
        messaging.server.emit(Message.Consume, id);
      else if (isTool)
        this.hotbar.addItem(id);
    }));
    trash.add(button.MouseButton2Click.Connect(() => {
      if (!canDrop) return;

      const characterPivot = this.character.getPivot();
      if (!characterPivot) return;

      const position = characterPivot.Position
        .add(characterPivot.LookVector.mul(2))
        .add(DROP_OFFSET);

      messaging.server.emit(Message.DropItem, { id, position });
    }));
    trash.add(button.MouseEnter.Connect((x, y) => {
      this.updateHoverInfo(x, y);
      this.enableHoverInfo(itemTemplate);
    }));
    trash.add(button.MouseLeave.Connect(() => this.disableHoverInfo()));
    trash.add(button.MouseMoved.Connect((x, y) => this.updateHoverInfo(x, y)));
    button.Parent = this.itemContainer;

    this.buttonInfos.set(id, { button, trash });
    return button;
  }

  private enableHoverInfo(item: Model): void {
    const { hoverInfo } = this;
    hoverInfo.Title.Text = getDisplayName(item);
    hoverInfo.ID.Text = item.GetAttribute<string>("ID")!;
    this.tweenHoverInfoTransparency(0);
  }

  private disableHoverInfo(): void {
    this.tweenHoverInfoTransparency(1);
  }

  private tweenHoverInfoTransparency(transparency: number): void {
    TweenBuilder.for(this.hoverInfo)
      .time(HOVER_INFO_FADE_DURATION)
      .property("GroupTransparency", transparency)
      .play();
    TweenBuilder.for(this.hoverInfo.UIStroke)
      .time(HOVER_INFO_FADE_DURATION)
      .property("Transparency", math.max(transparency, 0.6))
      .play();
  }

  private updateHoverInfo(x: number, y: number): void {
    this.hoverInfo.Position = this.baseHoverInfoPosition.add(UDim2.fromOffset(x, y));
  }
}