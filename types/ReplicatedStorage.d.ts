interface ReplicatedStorage extends Instance {
  Assets: Folder & {
    Animations: Folder & {
      Swing: Animation;
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
      InventoryItem: Frame & {
        Viewport: ViewportFrame;
      };
    }
  };
}