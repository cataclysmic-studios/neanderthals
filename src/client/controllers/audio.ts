import { Controller, type OnStart } from "@flamework/core";
import { SoundService } from "@rbxts/services";

import { Message, messaging } from "shared/messaging";
import { assets } from "shared/constants";
import type { PlayAudioOptions } from "shared/structs/packets";

import type { CharacterController } from "./character";
import { TweenBuilder } from "@rbxts/twin";

const RNG = new Random;

@Controller()
export class AudioController implements OnStart {
  public constructor(
    private readonly character: CharacterController
  ) { }

  public onStart(): void {
    messaging.client.on(Message.ReplicateAudio, options =>
      this.replicate(options.name, options)
    );
    messaging.client.on(Message.ReplicateAudioStopGlobal, ({ name, fadeTime }) =>
      this.stopGlobal(name, fadeTime)
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

  private stopGlobal(name: AudioName, fadeTime?: number): void {
    const audio = SoundService.FindFirstChild<Sound>(name);
    if (!audio)
      return warn(`Attempted to stop global audio "${name}" but it was not found in SoundService.`);

    if (fadeTime !== undefined) {
      TweenBuilder.for(audio)
        .time(fadeTime)
        .property("Volume", 0)
        .onCompleted(() => audio.Destroy())
        .play();
    } else {
      audio.Destroy();
    }
  }

  private replicate(name: AudioName, { parent = SoundService, volume, speed, fadeTime }: PlayAudioOptions = {}): Sound {
    const template = assets.Audio.WaitForChild(name) as Sound;
    const sound = template.Clone();
    const finalVolume = volume ?? sound.Volume;
    if (fadeTime !== undefined) {
      TweenBuilder.for(sound)
        .time(fadeTime)
        .property("Volume", finalVolume)
        .play();
    } else {
      sound.Volume = finalVolume;
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