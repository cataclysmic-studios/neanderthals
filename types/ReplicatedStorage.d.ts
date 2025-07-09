interface ReplicatedStorage extends Instance {
  Assets: Folder & {
    Animations: Folder & {
      Hit: Animation;
    };
    Items: Folder & {
      Rock: ToolItem;
    };
  };
}