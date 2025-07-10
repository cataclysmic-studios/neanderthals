import { Service, Modding, type OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";

import type { OnPlayerAdd, OnPlayerRemove } from "server/hooks";

@Service()
export class PlayersService implements OnStart {
  public onStart(): void {
    const addListeners = new Set<OnPlayerAdd>;
    const removeListeners = new Set<OnPlayerRemove>;
    Modding.onListenerAdded<OnPlayerAdd>(obj => addListeners.add(obj));
    Modding.onListenerAdded<OnPlayerRemove>(obj => removeListeners.add(obj));

    Players.PlayerAdded.Connect(player => {
      for (const obj of addListeners)
        obj.onPlayerAdd(player);
    });
    Players.PlayerRemoving.Connect(player => {
      for (const obj of removeListeners)
        obj.onPlayerRemove(player);
    });
  }
}