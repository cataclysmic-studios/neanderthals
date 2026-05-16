export const enum WeatherKind {
  Sunny,
  PartlyCloudy,
  Cloudy,
  Rainy,
  Stormy,
}

export interface WeatherConfig {
  readonly weather: WeatherKind;
  readonly atmosphereDensity: number;
  readonly atmosphereGlare: number;
  readonly atmosphereOffset: number;
  readonly atmosphereColor: Color3;
  readonly cloudDensity: number;
  readonly cloudCover: number;
  readonly cloudColor: Color3;
  readonly ambient: Color3;
  readonly outdoorAmbient: Color3;
  readonly exposure: number;
  readonly duration: number;
  readonly transitionTime: number;
}