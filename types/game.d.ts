interface HotbarButton extends ImageButton {
  Viewport: ViewportFrame;
}

type HotbarKey = typeof Enum.KeyCode[HotbarKeys[number]];
type HotbarKeys = [
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six"
];

interface IngredientFrame extends Frame {
  Title: TextLabel;
  Viewport: ViewportFrame;
}

interface RecipeFrame extends Frame {
  Title: TextLabel;
  Viewport: ViewportFrame;
  Craft: GuiButton;
  Ingredients: Frame;
}

interface ItemButton extends ImageButton {
  Viewport: ViewportFrame;
  Count: TextLabel;
}

interface ProgressBarFrame extends Frame {
  Bar: Frame;
}

type StructureName = ExtractKeys<ReplicatedStorage["Assets"]["Structures"], Model>;
type NaturalStructureName = ExtractKeys<ReplicatedStorage["Assets"]["NaturalStructures"], Model>;
type ItemName = ExtractKeys<ReplicatedStorage["Assets"]["Items"], Model>;
type CreatureName = ExtractKeys<ReplicatedStorage["Assets"]["Creatures"], CreatureModel>;

type ToolName = ExtractKeys<ReplicatedStorage["Assets"]["Items"], ToolItem>;
interface ToolItem extends Model {
  Handle: BasePart & {
    HandWeld: Weld;
  };
}

interface GateStructureModel extends StructureModel {
  Door: BasePart;
  Button: BasePart & {
    ClickDetector: ClickDetector;
  };
}

interface StructureModel extends Model {
  Config: ModuleScript;
  Humanoid: Humanoid;
}

interface CreatureServerModel extends Model {
  Root: Part;
  Humanoid: Humanoid;
}

interface CreatureModel extends Model {
  Config: ModuleScript;
  Humanoid: Humanoid & {
    Animator: Animator;
  };
  Animations: Folder & {
    Idle: Animation;
    Walk: Animation;
  };
}

interface CharacterModel extends Model {
  Head: BasePart;
  Humanoid: Humanoid & {
    Animator: Animator;
  };
  HumanoidRootPart: BasePart;
  RightHand: BasePart;
}