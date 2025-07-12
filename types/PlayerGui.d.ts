interface PlayerGui extends BasePlayerGui {
  Main: ScreenGui & {
    DamageDisplay: Frame & {
      Title: TextLabel;
      Health: Frame & {
        Bar: Frame;
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