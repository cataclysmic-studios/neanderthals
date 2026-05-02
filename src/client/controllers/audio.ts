import { Controller, type OnStart } from "@flamework/core";
import { SoundService } from "@rbxts/services";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import type { PlayAudioOptions } from "shared/structs/packets";

import type { CharacterController } from "./character";

const RNG = new Random

@Controller()
export class AudioController implements OnStart {
  public constructor(
    private readonly character: CharacterController
  ) { }

  public onStart(): void {
    messaging.client.on(Message.ReplicateAudio, ({ name, parent, volume }) =>
      this.replicate(name, { parent, volume })
    );
  }

  public playRandomSpeed(name: AudioName, options?: PlayAudioOptions, interval = 0.1, replicate = true): Sound {
    const sound = this.replicate(name, options);
    if (!replicate)
      return sound;

    const { parent, volume, speed = 1 } = options ?? {};
    const randomizedSpeed = RNG.NextNumber(speed - interval, speed + interval);
    messaging.server.emit(Message.PlayAudio, { name, parent, volume, speed: randomizedSpeed });

    return sound;
  }

  public play(name: AudioName, options?: PlayAudioOptions, replicate = true): Sound {
    const sound = this.replicate(name, options);
    if (!replicate)
      return sound;

    const { parent, volume, speed } = options ?? {};
    messaging.server.emit(Message.PlayAudio, { name, parent, volume, speed });
    return sound;
  }

  public playCharacter(name: AudioName, options?: Omit<PlayAudioOptions, "parent">, replicate = true): Maybe<Sound> {
    const root = this.character.getRoot();
    if (!root) return;

    options = { ...options, parent: root } as never;
    const sound = this.replicate(name, options);
    if (!replicate)
      return sound;

    const { volume } = options ?? {};
    messaging.server.emit(Message.PlayAudio, { name, parent: root, volume });
    return sound;
  }

  private replicate(name: AudioName, { parent = SoundService, volume, speed }: PlayAudioOptions = {}): Sound {
    const template = assets.Audio.WaitForChild(name) as Sound;
    const sound = template.Clone();
    if (volume !== undefined) {
      sound.Volume = volume;
    }
    if (speed !== undefined) {
      sound.PlaybackSpeed = speed;
    }

    sound.Parent = parent;
    sound.Ended.Once(() => sound.Destroy());
    sound.Play();
    return sound;
  }
}