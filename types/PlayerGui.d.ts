interface PlayerGui extends BasePlayerGui {
  Main: ScreenGui & {
    DamageDisplay: Frame & {
      Title: TextLabel;
      Health: Frame & {
        Bar: Frame;
        Amount: TextLabel;
      };
    };
    Inventory: Frame & {
      Content: ScrollingFrame;
      Separator: Frame;
    };
    Stats: Frame & {
      BagSpace: Frame & {
        Bar: Frame;
      };
      Hunger: Frame & {
        Bar: Frame;
      };
      Health: Frame & {
        Bar: Frame;
      };
    };
  };
}