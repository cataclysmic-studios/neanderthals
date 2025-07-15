interface PlayerGui extends BasePlayerGui {
  Main: ScreenGui & {
    ActionButtons: Frame & {
      Inventory: ImageButton;
      Tribes: ImageButton;
    };
    DamageDisplay: Frame & {
      Title: TextLabel;
      Health: ProgressBarFrame & {
        Amount: TextLabel;
      };
    };
    Hotbar: Frame & Record<HotbarKey["Name"], HotbarButton>;
    Inventory: Frame & {
      Content: ScrollingFrame;
      Separator: Frame;
    };
    Crafting: Frame & {
      Content: ScrollingFrame;
      Separator: Frame;
    };
    LevelStats: Frame & {
      Level: TextLabel;
      XP: ProgressBarFrame & {
        Amount: TextLabel;
      };
    };
    Stats: Frame & {
      BagSpace: ProgressBarFrame;
      Hunger: ProgressBarFrame;
      Health: ProgressBarFrame;
    };
  };
}