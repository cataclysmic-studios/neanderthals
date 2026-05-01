import { Controller, type OnStart } from "@flamework/core";
import { SoundService } from "@rbxts/services";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";

interface PlayAudioOptions {
  readonly parent?: Instance;
  readonly volume?: number;
}

@Controller()
export class AudioController implements OnStart {
  public onStart(): void {
    messaging.client.on(Message.ReplicateAudio, ({ name, parent, volume }) =>
      this.replicate(name, { parent, volume })
    );
  }

  public play(name: AudioName, replicate = true, options?: PlayAudioOptions): Sound {
    const sound = this.replicate(name, options);
    if (!replicate)
      return sound;

    const { parent, volume } = options ?? {};
    messaging.server.emit(Message.PlayAudio, { name, parent, volume });
    return sound;
  }

  private replicate(name: AudioName, { parent = SoundService, volume }: PlayAudioOptions = {}): Sound {
    const template = assets.Audio.WaitForChild(name) as Sound;
    const sound = template.Clone();
    if (volume !== undefined) {
      sound.Volume = volume;
    }

    sound.Parent = parent;
    sound.Ended.Once(() => sound.Destroy());
    sound.Play();
    return sound;
  }
}