type StructureName = ExtractKeys<ReplicatedStorage["Assets"]["Structures"], Model>;

type ToolName = ExtractKeys<ReplicatedStorage["Assets"]["Items"], ToolItem>;
interface ToolItem extends Model {
  Handle: BasePart & {
    HandWeld: Weld;
  };
}

interface StructureModel extends Model {
  Humanoid: Humanoid;
  Config: ModuleScript;
}

interface CharacterModel extends Model {
  Head: BasePart;
  Humanoid: Humanoid & {
    Animator: Animator;
  };
  HumanoidRootPart: BasePart & {
    RootAttachment: Attachment
  };
  RightHand: BasePart;
}