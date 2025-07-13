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
      WoodPickaxe: ToolItem;
      Leaves: Model;
      Log: Model;
      Stick: Model;
      RawMeat: Model;
    };
    Structures: Folder & {
      WoodWall: Model;
    };
    UI: Folder & {
      DroppedItemUI: BillboardGui & {
        ItemName: TextLabel;
        PickUp: TextLabel;
        Eat: TextLabel;
      };
      InventoryItem: ItemButton;
      CraftingRecipeFrame: RecipeFrame;
      IngredientFrame: IngredientFrame;
    }
  };
}