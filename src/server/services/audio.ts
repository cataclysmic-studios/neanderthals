import { Service, type OnStart } from "@flamework/core";

import { Message, messaging } from "shared/messaging";
import { PlayAudioOptions } from "shared/structs/packets";

const RNG = new Random;

@Service()
export class AudioService implements OnStart {
  public onStart(): void {
    messaging.server.on(Message.PlayAudio, (player, { name, parent, volume }) =>
      messaging.client.emitExcept(player, Message.ReplicateAudio, { name, parent, volume })
    );
  }

  public play(to: Player | Player[], name: AudioName, options: PlayAudioOptions = {}): void {
    messaging.client.emit(to, Message.ReplicateAudio, { name, ...options });
  }

  public playRandomSpeed(to: Player | Player[], name: AudioName, options: PlayAudioOptions = {}, interval = 0.1): void {
    const { speed = 1 } = options;
    const randomizedSpeed = RNG.NextNumber(speed - interval, speed + interval);
    messaging.client.emit(to, Message.ReplicateAudio, { name, ...options, speed: randomizedSpeed });
  }
}