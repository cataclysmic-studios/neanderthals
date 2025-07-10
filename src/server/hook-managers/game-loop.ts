import { Service, Modding, type OnStart } from "@flamework/core";
import { RunService as Runtime } from "@rbxts/services";

import type { OnFixed } from "shared/hooks";

const FIXED_RATE = 20; // hz

@Service()
export class GameLoopService implements OnStart {
  public onStart(): void {
    const onFixedListeners = new Set<OnFixed>;
    Modding.onListenerAdded<OnFixed>(obj => onFixedListeners.add(obj));
    Modding.onListenerRemoved<OnFixed>(obj => onFixedListeners.delete(obj));

    const elapsedMap = new Map<OnFixed, number>;
    const fixedRateSeconds = 1 / FIXED_RATE;
    Runtime.Heartbeat.Connect(dt => {
      for (const obj of onFixedListeners) {
        if (!elapsedMap.has(obj)) {
          elapsedMap.set(obj, dt);
        }

        let newElapsed = elapsedMap.get(obj)! + dt;
        if (newElapsed >= fixedRateSeconds) {
          obj.onFixed(newElapsed);
          newElapsed -= fixedRateSeconds;
        }

        elapsedMap.set(obj, newElapsed);
      }
    });
  }
}