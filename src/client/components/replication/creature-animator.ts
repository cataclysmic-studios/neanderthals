import { Component } from "@flamework/components";
import { $nameof } from "rbxts-transform-debug";
import DestroyableComponent from "shared/base-components/destroyable";

import type { PlayAnimationOptions } from "shared/structs/animation";

const { random } = math;
const { clock } = os;

const getNextIdleTime = () => random(6, 20);

@Component({ tag: $nameof<CreatureAnimator>() })
export class CreatureAnimator extends DestroyableComponent<{ ID: number }, CreatureModel> {
  private readonly humanoid;
  private readonly idleAnimation;
  private readonly walkAnimation;

  private tracks = new Map<Animation, AnimationTrack>;
  private nextIdleTime = getNextIdleTime();
  private lastIdle = clock();
  private idle = false;

  public constructor() {
    super();
    this.trash.add(() => this.tracks = undefined!);

    const animations = this.instance.Animations;
    this.humanoid = this.instance.Humanoid;
    this.idleAnimation = animations.Idle;
    this.walkAnimation = animations.Walk;
  }

  public tryIdle(): void {
    const { lastIdle, idleAnimation } = this;
    if (lastIdle && clock() - lastIdle < this.nextIdleTime) return;
    if (this.isAnimationPlaying(idleAnimation)) return;
    if (this.idle) return;
    this.idle = true;

    const idleLength = getNextIdleTime();
    task.delay(idleLength, () => this.idle = false);

    this.playAnimation(idleAnimation, { fadeTime: 0 });
    this.lastIdle = clock();
    this.nextIdleTime = getNextIdleTime();
  }

  public isIdle(): boolean {
    return this.idle;
  }

  public startWalk(): void {
    this.playAnimation(this.walkAnimation);
  }

  public stopWalk(): void {
    this.loadAnimation(this.walkAnimation)?.Stop();
  }

  private playAnimation(animation: Animation, { fadeTime }: PlayAnimationOptions = {}): Maybe<AnimationTrack> {
    const track = this.loadAnimation(animation);
    track?.Play(fadeTime);

    return track;
  }

  private isAnimationPlaying(animation: Animation): boolean {
    return this.loadAnimation(animation)?.IsPlaying ?? false;
  }

  private loadAnimation(animation: Animation): Maybe<AnimationTrack> {
    if (!this.isAlive()) return;

    const existingTrack = this.tracks.get(animation);
    if (existingTrack)
      return existingTrack;

    const track = this.humanoid.Animator.LoadAnimation(animation);
    this.tracks.set(animation, track);

    return this.trash.add(track);
  }

  private isAlive(): boolean {
    return this.humanoid.Health > 0;
  }
}