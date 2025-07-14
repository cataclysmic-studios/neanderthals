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
      StonePickaxe: ToolItem;
      IronPickaxe: ToolItem;
      Leaves: Model;
      Log: Model;
      Stick: Model;
      Stone: Model;
      RawMeat: Model;
      CookedMeat: Model;
      RawIron: Model;
      IronBar: Model;
    };
    Structures: Folder & {
      WoodWall: Model;
      Campfire: Model;
    };
    UI: Folder & {
      CookProgressUI: BillboardGui & {
        Progress: ProgressBarFrame;
      };
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