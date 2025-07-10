import { Service, Modding, type OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";

import type { OnPlayerAdd, OnPlayerRemove } from "server/hooks";

@Service()
export class PlayersService implements OnStart {
  public onStart(): void {
    const addListeners = new Set<OnPlayerAdd>;
    const removeListeners = new Set<OnPlayerRemove>;
    Modding.onListenerAdded<OnPlayerAdd>(obj => addListeners.add(obj));
    Modding.onListenerRemoved<OnPlayerAdd>(obj => addListeners.delete(obj));
    Modding.onListenerAdded<OnPlayerRemove>(obj => removeListeners.add(obj));
    Modding.onListenerRemoved<OnPlayerRemove>(obj => removeListeners.delete(obj));

    Players.PlayerAdded.Connect(player => {
      for (const obj of addListeners)
        task.defer(() => obj.onPlayerAdd(player));
    });
    Players.PlayerRemoving.Connect(player => {
      for (const obj of removeListeners)
        task.spawn(() => obj.onPlayerRemove(player));
    });

    for (const player of Players.GetPlayers())
      for (const obj of addListeners)
        task.defer(() => obj.onPlayerAdd(player));
  }
}