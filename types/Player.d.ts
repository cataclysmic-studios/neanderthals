interface Player extends Instance {
  PlayerScripts: PlayerScripts;
  PlayerGui: PlayerGui;
  Character: Maybe<CharacterModel>;
  readonly CharacterAdded: RBXScriptSignal<(character: CharacterModel) => void>;
}