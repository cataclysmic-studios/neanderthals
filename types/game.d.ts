type StructureName = ExtractKeys<ReplicatedStorage["Assets"]["Structures"], Model>;
type ItemName = ExtractKeys<ReplicatedStorage["Assets"]["Items"], Model>;
type CreatureName = ExtractKeys<ReplicatedStorage["Assets"]["Creatures"], CreatureModel>;

type ToolName = ExtractKeys<ReplicatedStorage["Assets"]["Items"], ToolItem>;
interface ToolItem extends Model {
  Handle: BasePart & {
    HandWeld: Weld;
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