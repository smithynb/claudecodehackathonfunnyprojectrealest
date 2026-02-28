export type InputMode = "normal" | "command" | "shop"

export type Season = "spring" | "summer" | "fall" | "winter"

export type Weather = "sunny" | "rainy" | "cloudy" | "drought"

export type Tool = "hand" | "water" | "seed" | "harvest"

export type PlantType =
  | "carrot"
  | "sunflower"
  | "tomato"
  | "rose"
  | "mushroom"
  | "pumpkin"

export interface GrowthStage {
  name: string
  /** 3-line ASCII art, each line max 5 chars wide */
  sprite: [string, string, string]
  /** Foreground color hex */
  color: string
}

export interface PlantDefinition {
  type: PlantType
  name: string
  cost: number
  sellValue: number
  growthDays: number
  waterNeed: "low" | "medium" | "high"
  /** Which seasons the plant thrives in (grows at normal speed) */
  preferredSeasons: Season[]
  stages: GrowthStage[]
}

export interface PlantInstance {
  type: PlantType
  /** Current growth stage index */
  stageIndex: number
  /** Growth progress within the current stage (0.0 - 1.0) */
  growthProgress: number
  /** Current water level (0.0 - 1.0), drops each day */
  waterLevel: number
  /** Whether the plant is dead from neglect */
  isDead: boolean
  /** Day the plant was planted */
  plantedDay: number
}

export type SoilState = "dry" | "normal" | "wet"

export interface GardenCell {
  plant: PlantInstance | null
  soilState: SoilState
  /** Whether this cell is unlocked for planting */
  unlocked: boolean
}

export interface GameState {
  /** The garden grid (rows x cols) */
  grid: GardenCell[][]
  /** Grid dimensions */
  gridRows: number
  gridCols: number
  /** Player cursor position */
  cursorRow: number
  cursorCol: number
  /** Current day number */
  day: number
  /** Current season */
  season: Season
  /** Current weather */
  weather: Weather
  /** Player gold */
  gold: number
  /** Currently selected tool */
  selectedTool: Tool
  /** Currently selected seed type (when tool is "seed") */
  selectedSeed: PlantType
  /** Current input mode */
  inputMode: InputMode
  /** Command line buffer for command mode */
  commandBuffer: string
  /** Whether the shop is open */
  shopOpen: boolean
  /** Shop cursor position */
  shopCursor: number
  /** Whether the game is paused */
  paused: boolean
  /** Message to display in status bar */
  statusMessage: string
  /** Timer for status message clearing */
  statusMessageTimer: number
  /** Total plants harvested */
  totalHarvested: number
  /** Total gold earned */
  totalEarned: number
  /** Auto-advance day timer (seconds) */
  dayTimer: number
  /** Day duration in seconds */
  dayDuration: number
  /** Whether auto-advance is enabled */
  autoAdvance: boolean
}

export interface ShopItem {
  type: PlantType
  name: string
  cost: number
  description: string
}
