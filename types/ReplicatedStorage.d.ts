interface ReplicatedStorage extends Instance {
  Assets: Folder & {
    CreatureServerModel: CreatureServerModel;
    Animations: Folder & {
      Swing: Animation;
    };
    Creatures: Folder & {
      Pig: CreatureModel;
    };
    Items: Folder & {
      Rock: ToolItem;
      GodRock: ToolItem;
    };
    Structures: Folder & {

    };
    UI: Folder & {
      DroppedItemUI: BillboardGui & {
        ItemName: TextLabel;
        PickUp: TextLabel;
        Eat: TextLabel;
      };
      InventoryItem: ItemButton;
    }
  };
}