import type { GameState, PlantType } from "./types.ts"
import { createGrid, advanceDay, plantSeed, waterCell, harvestCell } from "./garden.ts"
import { getPlantDef } from "./plants.ts"
import { rollWeather } from "./weather.ts"
import { getSeasonForDay } from "./time.ts"

const DEFAULT_GRID_ROWS = 6
const DEFAULT_GRID_COLS = 8
const DEFAULT_DAY_DURATION = 8 // seconds per day

export function createGameState(): GameState {
  const season = getSeasonForDay(1)
  return {
    grid: createGrid(DEFAULT_GRID_ROWS, DEFAULT_GRID_COLS),
    gridRows: DEFAULT_GRID_ROWS,
    gridCols: DEFAULT_GRID_COLS,
    cursorRow: 0,
    cursorCol: 0,
    day: 1,
    season,
    weather: rollWeather(season),
    gold: 50,
    selectedTool: "hand",
    selectedSeed: "carrot",
    inputMode: "normal",
    commandBuffer: "",
    shopOpen: false,
    shopCursor: 0,
    paused: false,
    statusMessage: "Welcome to your garden! Press [S] to open shop, buy seeds, and start planting!",
    statusMessageTimer: 0,
    totalHarvested: 0,
    totalEarned: 0,
    dayTimer: 0,
    dayDuration: DEFAULT_DAY_DURATION,
    autoAdvance: false,
  }
}

export function setStatusMessage(state: GameState, message: string, durationMs: number = 3000): void {
  state.statusMessage = message
  state.statusMessageTimer = durationMs
}

export function moveCursor(state: GameState, dr: number, dc: number): void {
  state.cursorRow = Math.max(0, Math.min(state.gridRows - 1, state.cursorRow + dr))
  state.cursorCol = Math.max(0, Math.min(state.gridCols - 1, state.cursorCol + dc))
}

export function doPlant(state: GameState, type: PlantType): void {
  const def = getPlantDef(type)
  const error = plantSeed(state, state.cursorRow, state.cursorCol, type)
  if (error) {
    setStatusMessage(state, error)
  } else {
    setStatusMessage(state, `Planted ${def.name} for ${def.cost}g. Water it to help it grow!`)
  }
}

export function doWater(state: GameState): void {
  const error = waterCell(state, state.cursorRow, state.cursorCol)
  if (error) {
    setStatusMessage(state, error)
  } else {
    setStatusMessage(state, "Watered the plant!")
  }
}

export function doHarvest(state: GameState): void {
  const result = harvestCell(state, state.cursorRow, state.cursorCol)
  if (result) {
    setStatusMessage(state, result)
  }
}

export function doDelete(state: GameState): void {
  const cell = state.grid[state.cursorRow]?.[state.cursorCol]
  if (!cell || !cell.plant) {
    setStatusMessage(state, "Nothing to delete here.")
    return
  }

  const def = getPlantDef(cell.plant.type)
  const isReady = !cell.plant.isDead && cell.plant.stageIndex >= def.stages.length - 1
  if (cell.plant.isDead || isReady) {
    state.selectedTool = "harvest"
    doHarvest(state)
    return
  }

  cell.plant = null
  cell.soilState = "dry"
  state.selectedTool = "harvest"
  setStatusMessage(state, `Removed ${def.name} before harvest.`)
}

export function doNextDay(state: GameState): void {
  advanceDay(state)
  state.day++
  state.season = getSeasonForDay(state.day)
  state.weather = rollWeather(state.season)
  state.dayTimer = 0
  setStatusMessage(state, `Day ${state.day} begins. Weather: ${state.weather}.`, 2000)
}

export function doInteract(state: GameState): void {
  const cell = state.grid[state.cursorRow]?.[state.cursorCol]
  if (!cell) return

  if (!cell.plant) {
    state.selectedTool = "seed"
    doPlant(state, state.selectedSeed)
    return
  }

  if (cell.plant.isDead) {
    state.selectedTool = "harvest"
    doHarvest(state)
    return
  }

  const def = getPlantDef(cell.plant.type)
  const isReady = cell.plant.stageIndex >= def.stages.length - 1
  if (isReady) {
    state.selectedTool = "harvest"
    doHarvest(state)
  } else {
    state.selectedTool = "water"
    doWater(state)
  }
}

export function tickGame(state: GameState, deltaMs: number): void {
  // Update status message timer
  if (state.statusMessageTimer > 0) {
    state.statusMessageTimer -= deltaMs
    if (state.statusMessageTimer <= 0) {
      state.statusMessage = ""
      state.statusMessageTimer = 0
    }
  }

  // Auto-advance day
  if (state.autoAdvance && !state.paused && !state.shopOpen && state.inputMode !== "command") {
    state.dayTimer += deltaMs / 1000
    if (state.dayTimer >= state.dayDuration) {
      doNextDay(state)
    }
  }
}
