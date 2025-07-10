import { Controller } from "@flamework/core";

import { assets } from "shared/constants";

import type { CharacterController } from "./character";

interface PlayAnimationOptions {
  readonly fadeTime?: number;
}

@Controller()
export class AnimationController {
  private tracks = new Map<Animation, AnimationTrack>;

  public constructor(
    private readonly character: CharacterController
  ) {
    character.spawned.Connect(() => {
      this.tracks = new Map;
      this.loadDefaultTracks();
    });
  }

  public play(animation: Animation, { fadeTime }: PlayAnimationOptions = {}): Maybe<AnimationTrack> {
    const track = this.load(animation);
    track?.Play(fadeTime);

    return track;
  }

  private load(animation: Animation): Maybe<AnimationTrack> {
    if (!this.character.isAlive()) return;

    const existingTrack = this.tracks.get(animation);
    if (existingTrack)
      return existingTrack;

    const animator = this.character.getAnimator()!;
    const track = animator.LoadAnimation(animation);
    this.tracks.set(animation, track);

    return track;
  }

  private loadDefaultTracks(): void {
    this.load(assets.Animations.Swing);
  }
}