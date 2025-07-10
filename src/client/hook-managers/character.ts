import { Controller, Modding, type OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";

import type { OnCharacterAdd, OnCharacterRemove } from "client/hooks";

@Controller()
export class CharacterController implements OnStart {
  public onStart(): void {
    const addListeners = new Set<OnCharacterAdd>;
    const removeListeners = new Set<OnCharacterRemove>;
    Modding.onListenerAdded<OnCharacterAdd>(obj => addListeners.add(obj));
    Modding.onListenerAdded<OnCharacterRemove>(obj => removeListeners.add(obj));

    const player = Players.LocalPlayer;
    player.CharacterAdded.Connect(character => {
      for (const obj of addListeners)
        task.spawn(() => obj.onCharacterAdd(character as never));
    });
    player.CharacterRemoving.Connect(character => {
      for (const obj of removeListeners)
        task.spawn(() => obj.onCharacterRemove(character as never));
    });

    const existingCharacter = player.Character;
    if (existingCharacter)
      for (const obj of addListeners)
        task.spawn(() => obj.onCharacterAdd(existingCharacter as never));
  }
}