import { Service, type OnStart } from "@flamework/core";

import { Message, messaging } from "shared/messaging";

@Service()
export class AudioService implements OnStart {
  public onStart(): void {
    messaging.server.on(Message.PlayAudio, (player, { name, parent, volume }) =>
      messaging.client.emitExcept(player, Message.ReplicateAudio, { name, parent, volume })
    );
  }
}