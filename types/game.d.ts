interface ToolItem extends Model {
  Handle: BasePart & {
    HandWeld: Weld;
  };
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