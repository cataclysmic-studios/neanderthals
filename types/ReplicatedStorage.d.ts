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
      Club: ToolItem;
      WoodPickaxe: ToolItem;
      WoodAxe: ToolItem;
      StonePickaxe: ToolItem;
      StoneAxe: ToolItem;
      Mace: ToolItem;
      IronPickaxe: ToolItem;
      IronAxe: ToolItem;
      Leaves: Model;
      Log: Model;
      Stick: Model;
      Stone: Model;
      RawMeat: Model;
      CookedMeat: Model;
      RawIron: Model;
      IronBar: Model;
      Flux: Model;
    };
    NaturalStructures: Folder & {
      Tree: StructureModel;
      Bush: StructureModel
      Rock: StructureModel;
      ["Big Rock"]: StructureModel;
      ["Iron Node"]: StructureModel;
      ["Gold Node"]: StructureModel;
      ["Flux Cluster"]: StructureModel;
    }
    Structures: Folder & {
      WoodWall: StructureModel;
      Campfire: StructureModel;
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