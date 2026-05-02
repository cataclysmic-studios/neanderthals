import { Service, type OnStart } from "@flamework/core";

import { Message, messaging } from "shared/messaging";
import { PlayAudioOptions } from "shared/structs/packets";

@Service()
export class AudioService implements OnStart {
  public onStart(): void {
    messaging.server.on(Message.PlayAudio, (player, { name, parent, volume }) =>
      messaging.client.emitExcept(player, Message.ReplicateAudio, { name, parent, volume })
    );
  }

  public playAudio(to: Player | Player[], name: AudioName, options: PlayAudioOptions = {}): void {
    messaging.client.emit(to, Message.ReplicateAudio, { name, ...options });
  }
}