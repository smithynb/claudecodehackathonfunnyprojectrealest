import type { Season, Weather } from "./types.ts"

/**
 * Weather probabilities by season.
 * Each array: [sunny, rainy, cloudy, drought] weights.
 */
const WEATHER_WEIGHTS: Record<Season, [number, number, number, number]> = {
  spring: [35, 35, 25, 5],
  summer: [45, 15, 15, 25],
  fall: [25, 30, 35, 10],
  winter: [15, 20, 55, 10],
}

const WEATHER_TYPES: Weather[] = ["sunny", "rainy", "cloudy", "drought"]

export function rollWeather(season: Season): Weather {
  const weights = WEATHER_WEIGHTS[season]
  const total = weights.reduce((a, b) => a + b, 0)
  let roll = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i]!
    if (roll <= 0) return WEATHER_TYPES[i]!
  }
  return "sunny"
}

export function getWeatherEmoji(weather: Weather): string {
  switch (weather) {
    case "sunny":
      return "*"
    case "rainy":
      return "~"
    case "cloudy":
      return "="
    case "drought":
      return "!"
  }
}

export function getWeatherLabel(weather: Weather): string {
  switch (weather) {
    case "sunny":
      return "Sunny"
    case "rainy":
      return "Rainy"
    case "cloudy":
      return "Cloudy"
    case "drought":
      return "Drought"
  }
}

export function getWeatherColor(weather: Weather): string {
  switch (weather) {
    case "sunny":
      return "#FFD600"
    case "rainy":
      return "#42A5F5"
    case "cloudy":
      return "#90A4AE"
    case "drought":
      return "#FF7043"
  }
}

/** Growth rate multiplier based on weather */
export function getWeatherGrowthMultiplier(weather: Weather): number {
  switch (weather) {
    case "sunny":
      return 1.0
    case "rainy":
      return 1.3
    case "cloudy":
      return 0.7
    case "drought":
      return 0.5
  }
}

/** Water drain rate multiplier based on weather */
export function getWeatherWaterDrain(weather: Weather): number {
  switch (weather) {
    case "sunny":
      return 0.2
    case "rainy":
      return -0.3 // negative = adds water
    case "cloudy":
      return 0.1
    case "drought":
      return 0.4
  }
}
