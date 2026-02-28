/** Empty cell sprites */
export const EMPTY_CELL_SPRITE: [string, string, string] = [
  "     ",
  "  .  ",
  " ... ",
]

export const DEAD_PLANT_SPRITE: [string, string, string] = [
  "  x  ",
  " /x\\ ",
  " xxx ",
]

/** Soil fill characters based on state */
export function getSoilChar(soilState: "dry" | "normal" | "wet"): string {
  switch (soilState) {
    case "dry":
      return "."
    case "normal":
      return ":"
    case "wet":
      return "~"
  }
}

/** Weather banner art (single line) */
export function getWeatherArt(weather: "sunny" | "rainy" | "cloudy" | "drought"): string {
  switch (weather) {
    case "sunny":
      return "\\|/ -*  *-  \\|/"
    case "rainy":
      return "  .::.  .::. ' "
    case "cloudy":
      return " ._==_.  ._==_."
    case "drought":
      return "  )  (  HOT!  "
  }
}

/** Tool icons */
export function getToolIcon(tool: "hand" | "water" | "seed" | "harvest"): string {
  switch (tool) {
    case "hand":
      return "[?]"
    case "water":
      return "[~]"
    case "seed":
      return "[o]"
    case "harvest":
      return "[#]"
  }
}

export function getToolName(tool: "hand" | "water" | "seed" | "harvest"): string {
  switch (tool) {
    case "hand":
      return "Inspect"
    case "water":
      return "Water"
    case "seed":
      return "Plant"
    case "harvest":
      return "Harvest"
  }
}
