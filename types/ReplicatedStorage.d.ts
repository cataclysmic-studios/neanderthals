interface ReplicatedStorage extends Instance {
  Assets: Folder & {
    Animations: Folder & {
      Swing: Animation;
    };
    Items: Folder & {
      Rock: ToolItem;
      ["God Rock"]: ToolItem;
    };
    Structures: Folder & {

    };
  };
}