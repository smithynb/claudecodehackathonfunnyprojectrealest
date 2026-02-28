import type {
  GardenCell,
  GameState,
  PlantInstance,
  PlantType,
  SoilState,
  Weather,
} from "./types.ts"
import { getPlantDef } from "./plants.ts"
import {
  getWeatherGrowthMultiplier,
  getWeatherWaterDrain,
} from "./weather.ts"

export function createEmptyCell(unlocked: boolean = true): GardenCell {
  return {
    plant: null,
    soilState: "normal",
    unlocked,
  }
}

export function createGrid(rows: number, cols: number): GardenCell[][] {
  const grid: GardenCell[][] = []
  for (let r = 0; r < rows; r++) {
    const row: GardenCell[] = []
    for (let c = 0; c < cols; c++) {
      row.push(createEmptyCell(true))
    }
    grid.push(row)
  }
  return grid
}

export function plantSeed(
  state: GameState,
  row: number,
  col: number,
  type: PlantType,
): string | null {
  const cell = state.grid[row]?.[col]
  if (!cell) return "Invalid cell."
  if (!cell.unlocked) return "This plot is locked."
  if (cell.plant) return "Something is already planted here."

  const def = getPlantDef(type)
  if (state.gold < def.cost) return `Not enough gold! Need ${def.cost}g.`

  state.gold -= def.cost

  const plant: PlantInstance = {
    type,
    stageIndex: 0,
    growthProgress: 0,
    waterLevel: 0.5,
    isDead: false,
    plantedDay: state.day,
  }

  cell.plant = plant
  cell.soilState = "normal"

  return null // success
}

export function waterCell(state: GameState, row: number, col: number): string | null {
  const cell = state.grid[row]?.[col]
  if (!cell) return "Invalid cell."
  if (!cell.plant) return "Nothing to water here."
  if (cell.plant.isDead) return "This plant is dead. Harvest to clear."

  cell.plant.waterLevel = Math.min(1.0, cell.plant.waterLevel + 0.4)
  cell.soilState = "wet"
  return null
}

export function harvestCell(state: GameState, row: number, col: number): string | null {
  const cell = state.grid[row]?.[col]
  if (!cell) return "Invalid cell."
  if (!cell.plant) return "Nothing to harvest here."

  const plant = cell.plant
  const def = getPlantDef(plant.type)

  if (plant.isDead) {
    // Clear dead plant
    cell.plant = null
    cell.soilState = "dry"
    return "Cleared dead plant."
  }

  // Check if fully grown (at last stage with progress >= 1.0, or just at last stage)
  const isReady = plant.stageIndex >= def.stages.length - 1
  if (!isReady) return "Not ready to harvest yet."

  const value = def.sellValue
  state.gold += value
  state.totalHarvested++
  state.totalEarned += value
  cell.plant = null
  cell.soilState = "dry"

  return `Harvested ${def.name} for ${value}g!`
}

export function advanceDay(state: GameState): void {
  const weather = state.weather

  for (let r = 0; r < state.gridRows; r++) {
    for (let c = 0; c < state.gridCols; c++) {
      const cell = state.grid[r]![c]!
      if (!cell.plant || cell.plant.isDead) {
        // Soil dries over time
        if (cell.soilState === "wet") cell.soilState = "normal"
        else if (cell.soilState === "normal" && weather === "drought") cell.soilState = "dry"
        continue
      }

      const plant = cell.plant
      const def = getPlantDef(plant.type)

      // Water drain/gain from weather
      const waterDrain = getWeatherWaterDrain(weather)
      plant.waterLevel = Math.max(0, Math.min(1.0, plant.waterLevel - waterDrain))

      // Update soil state based on water level
      if (plant.waterLevel > 0.6) cell.soilState = "wet"
      else if (plant.waterLevel > 0.2) cell.soilState = "normal"
      else cell.soilState = "dry"

      // Check if plant dies from no water
      if (plant.waterLevel <= 0) {
        plant.isDead = true
        cell.soilState = "dry"
        continue
      }

      // Growth calculation
      const isLastStage = plant.stageIndex >= def.stages.length - 1
      if (isLastStage) continue // fully grown, just waiting to harvest

      // Base growth per day = 1 / growthDays
      let growthRate = 1 / def.growthDays

      // Weather multiplier
      growthRate *= getWeatherGrowthMultiplier(weather)

      // Season bonus (1.5x in preferred season, 0.6x in winter if not preferred)
      const inSeason = def.preferredSeasons.includes(state.season)
      if (inSeason) {
        growthRate *= 1.4
      } else if (state.season === "winter") {
        growthRate *= 0.5
      }

      // Water bonus (well-watered plants grow faster)
      if (plant.waterLevel > 0.6) {
        growthRate *= 1.2
      } else if (plant.waterLevel < 0.3) {
        growthRate *= 0.6
      }

      // Advance growth
      const stagesCount = def.stages.length
      const progressPerStage = 1.0 / stagesCount
      plant.growthProgress += growthRate

      // Check if we advance to next stage
      const targetStage = Math.min(
        stagesCount - 1,
        Math.floor(plant.growthProgress * stagesCount),
      )
      if (targetStage > plant.stageIndex) {
        plant.stageIndex = targetStage
      }
    }
  }
}

export function getSoilColor(soilState: SoilState): string {
  switch (soilState) {
    case "dry":
      return "#8D6E63"
    case "normal":
      return "#6D4C41"
    case "wet":
      return "#4E342E"
  }
}

export function getWaterLevelLabel(level: number): string {
  if (level > 0.7) return "Soaked"
  if (level > 0.4) return "Moist"
  if (level > 0.1) return "Dry"
  return "Parched!"
}

export function getWaterLevelColor(level: number): string {
  if (level > 0.7) return "#42A5F5"
  if (level > 0.4) return "#66BB6A"
  if (level > 0.1) return "#FFA726"
  return "#EF5350"
}
