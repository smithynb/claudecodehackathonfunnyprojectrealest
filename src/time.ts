import type { Season } from "./types.ts"

const SEASONS: Season[] = ["spring", "summer", "fall", "winter"]
const DAYS_PER_SEASON = 7

export function getSeasonForDay(day: number): Season {
  const seasonIndex = Math.floor((day - 1) / DAYS_PER_SEASON) % SEASONS.length
  return SEASONS[seasonIndex]!
}

export function getDayInSeason(day: number): number {
  return ((day - 1) % DAYS_PER_SEASON) + 1
}

export function getSeasonLabel(season: Season): string {
  return season.charAt(0).toUpperCase() + season.slice(1)
}

export function getSeasonColor(season: Season): string {
  switch (season) {
    case "spring":
      return "#66BB6A"
    case "summer":
      return "#FFD600"
    case "fall":
      return "#FF8C00"
    case "winter":
      return "#90CAF9"
  }
}

export function getSeasonEmoji(season: Season): string {
  switch (season) {
    case "spring":
      return "~"
    case "summer":
      return "*"
    case "fall":
      return "#"
    case "winter":
      return "+"
  }
}

export function getYear(day: number): number {
  return Math.floor((day - 1) / (DAYS_PER_SEASON * SEASONS.length)) + 1
}
