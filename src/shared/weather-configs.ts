import { Lighting, Workspace as World } from "@rbxts/services";
import { WeatherKind, type WeatherConfig } from "./structs/weather";

const atmosphere = Lighting.Atmosphere;
const clouds = World.Terrain.Clouds;
const WEATHER_CONFIGS: Record<WeatherKind, WeatherConfig> = {
  [WeatherKind.Sunny]: {
    weather: WeatherKind.Sunny,
    atmosphereDensity: atmosphere.Density,
    atmosphereGlare: atmosphere.Glare,
    atmosphereOffset: atmosphere.Offset,
    atmosphereColor: atmosphere.Color,
    cloudDensity: clouds.Density,
    cloudCover: clouds.Cover,
    cloudColor: clouds.Color,
    ambient: Lighting.Ambient,
    outdoorAmbient: Lighting.OutdoorAmbient,
    exposure: Lighting.ExposureCompensation,
    duration: 300,
    transitionTime: 10
  },
  [WeatherKind.PartlyCloudy]: {
    weather: WeatherKind.PartlyCloudy,
    atmosphereDensity: 0.3,
    atmosphereGlare: 0.2,
    atmosphereOffset: 0,
    atmosphereColor: new Color3(0.75, 0.8, 0.95),
    cloudDensity: 0.2,
    cloudCover: 0.7,
    cloudColor: new Color3(0.81, 0.81, 0.81),
    ambient: Lighting.Ambient,
    outdoorAmbient: Lighting.OutdoorAmbient,
    exposure: 0,
    duration: 360,
    transitionTime: 15
  },
  [WeatherKind.Cloudy]: {
    weather: WeatherKind.Cloudy,
    atmosphereDensity: 0.35,
    atmosphereGlare: 0.2,
    atmosphereOffset: 1,
    atmosphereColor: new Color3(0.75, 0.8, 0.95),
    cloudDensity: 0.1,
    cloudCover: 0.82,
    cloudColor: new Color3(0.66, 0.66, 0.66),
    ambient: Lighting.Ambient,
    outdoorAmbient: Lighting.OutdoorAmbient,
    exposure: 0,
    duration: 200,
    transitionTime: 10
  },
  [WeatherKind.Rainy]: {
    weather: WeatherKind.Rainy,
    atmosphereDensity: 0.37,
    atmosphereGlare: 0,
    atmosphereOffset: 1,
    atmosphereColor: new Color3(0.75, 0.8, 0.95),
    cloudDensity: 0.1,
    cloudCover: 1,
    cloudColor: new Color3(0.66, 0.66, 0.66),
    ambient: Lighting.Ambient,
    outdoorAmbient: Lighting.OutdoorAmbient,
    exposure: 0,
    duration: 280,
    transitionTime: 8
  },
  [WeatherKind.Stormy]: {
    weather: WeatherKind.Stormy,
    atmosphereDensity: 0.4,
    atmosphereGlare: 0,
    atmosphereOffset: 1,
    atmosphereColor: new Color3(0.75, 0.8, 0.95),
    cloudDensity: 0.1,
    cloudCover: 1,
    cloudColor: new Color3(0.53, 0.53, 0.53),
    ambient: Lighting.Ambient,
    outdoorAmbient: Lighting.OutdoorAmbient,
    exposure: 0,
    duration: 250,
    transitionTime: 4
  }
};

export function getWeatherTransitionWeights(weather: WeatherKind): number[] {
  switch (weather) {
    case WeatherKind.Sunny:
      return [0.3, 0.5, 0.2, 0.0];
    case WeatherKind.PartlyCloudy:
      return [0.3, 0.3, 0.3, 0.1];
    case WeatherKind.Cloudy:
      return [0.1, 0.3, 0.4, 0.2];
    case WeatherKind.Rainy:
      return [0.0, 0.1, 0.4, 0.5];
    default:
      return [0.25, 0.25, 0.25, 0.25];
  }
}

export function getConfig(weather: WeatherKind): WeatherConfig {
  return WEATHER_CONFIGS[weather];
}