interface PlayerGui extends BasePlayerGui {
  Main: ScreenGui & {
    DamageDisplay: Frame & {
      Title: TextLabel;
      Health: Frame & {
        Bar: Frame;
        Amount: TextLabel;
      };
    };
  };
}