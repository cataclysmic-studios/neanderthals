import { Service } from "@flamework/core";
import { Lighting, Players, RunService, Workspace as World } from "@rbxts/services";
import { TweenBuilder } from "@rbxts/twin";

import { Message, messaging } from "shared/messaging";
import { WeatherKind } from "shared/structs/weather";
import { getConfig, getWeatherTransitionWeights } from "shared/weather-configs";
import type { OnFixed } from "shared/hooks";
import type { OnPlayerAdd } from "server/hooks";

import type { AudioService } from "./audio";

@Service()
export class WeatherService implements OnPlayerAdd, OnFixed {
  private readonly atmosphere = Lighting.Atmosphere;
  private readonly clouds = World.Terrain.Clouds;
  private current = WeatherKind.Sunny;
  private last?: WeatherKind;
  private transitioning = false;
  private cycleElapsed = 0;

  public constructor(
    private readonly audio: AudioService
  ) { }

  public onPlayerAdd(player: Player): void {
    messaging.client.emit(player, Message.UpdateWeather, this.current);
  }

  public onFixed(dt: number): void {
    if (this.transitioning) return;

    const { duration } = getConfig(this.current);
    const durationDamp = RunService.IsStudio() ? 10 : 1;
    this.cycleElapsed += dt;
    if (this.cycleElapsed >= duration / durationDamp) {
      this.cycleElapsed = 0;
      this.selectNextWeather();
    }
  }

  private selectNextWeather(): void {
    const weights = getWeatherTransitionWeights(this.current);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = math.random() * totalWeight;
    let selectedKind = WeatherKind.Sunny;

    for (let i = 0; i < weights.size(); i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedKind = i;
        break;
      }
    }

    this.setWeather(selectedKind);
  }

  private setWeather(weather: WeatherKind): void {
    if (weather === this.current) return;
    if (this.transitioning) return;

    this.last = this.current;
    this.current = weather;
    this.updateWeatherAudio();
    this.transitionWeather(weather);
    messaging.client.emitAll(Message.UpdateWeather, weather);
  }

  private updateWeatherAudio(): void {
    const { audio, last } = this;
    const { transitionTime } = getConfig(this.current);
    const players = Players.GetPlayers();
    const clearSounds = () => {
      if (last === WeatherKind.Rainy) {
        audio.stopGlobal(players, "RainLoop", transitionTime);
      } else if (last === WeatherKind.Stormy) {
        audio.stopGlobal(players, "ThunderLoop", transitionTime);
      }
    };

    switch (this.current) {
      case WeatherKind.Sunny:
      case WeatherKind.PartlyCloudy:
      case WeatherKind.Cloudy:
        clearSounds();
        break;

      case WeatherKind.Rainy:
        if (last === WeatherKind.Stormy) {
          audio.stopGlobal(players, "ThunderLoop", transitionTime);
        }
        audio.play(players, "RainLoop", { fadeTime: transitionTime });
        break;
      case WeatherKind.Stormy: {
        audio.play(players, "ThunderLoop", { fadeTime: transitionTime });
        if (last !== WeatherKind.Rainy) {
          audio.play(players, "RainLoop", { fadeTime: transitionTime });
        }
        break;
      }
    }
  }

  private transitionWeather(weather: WeatherKind): void {
    const { atmosphere, clouds } = this;
    const {
      atmosphereDensity, atmosphereGlare, atmosphereOffset, atmosphereColor,
      cloudDensity, cloudCover, cloudColor,
      ambient, outdoorAmbient, exposure,
      transitionTime
    } = getConfig(weather);

    this.transitioning = true;
    TweenBuilder.for(atmosphere)
      .time(transitionTime)
      .propertiesBulk({
        Density: atmosphereDensity,
        Glare: atmosphereGlare,
        Offset: atmosphereOffset,
        Color: atmosphereColor
      })
      .play();
    TweenBuilder.for(clouds)
      .time(transitionTime)
      .propertiesBulk({
        Density: cloudDensity,
        Cover: cloudCover,
        Color: cloudColor
      })
      .play();
    TweenBuilder.for(Lighting)
      .time(transitionTime)
      .propertiesBulk({
        Ambient: ambient,
        OutdoorAmbient: outdoorAmbient,
        ExposureCompensation: exposure
      })
      .onCompleted(() => this.transitioning = false)
      .play();
  }
}