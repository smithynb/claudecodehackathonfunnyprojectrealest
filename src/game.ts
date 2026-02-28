import type { GameState, GardenCell, PlantType } from "./types.ts"
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
    visualAnchor: null,
    day: 1,
    season,
    weather: rollWeather(season),
    gold: 50,
    selectedTool: "hand",
    selectedSeed: "carrot",
    inputMode: "normal",
    commandBuffer: "",
    pendingMotionPrefix: "",
    shopOpen: false,
    shopCursor: 0,
    paused: false,
    statusMessage: "Welcome to your garden! Press [S] to open the seed menu and start planting!",
    statusMessageTimer: 0,
    totalHarvested: 0,
    totalEarned: 0,
    dayTimer: 0,
    dayDuration: DEFAULT_DAY_DURATION,
    autoAdvance: false,
  }
}

export interface VisualSelection {
  minRow: number
  maxRow: number
  minCol: number
  maxCol: number
  width: number
  height: number
  cellCount: number
}

export function getVisualSelection(state: GameState): VisualSelection | null {
  if (state.inputMode !== "visual" || !state.visualAnchor) {
    return null
  }

  const minRow = Math.min(state.visualAnchor.row, state.cursorRow)
  const maxRow = Math.max(state.visualAnchor.row, state.cursorRow)
  const minCol = Math.min(state.visualAnchor.col, state.cursorCol)
  const maxCol = Math.max(state.visualAnchor.col, state.cursorCol)
  const width = maxCol - minCol + 1
  const height = maxRow - minRow + 1

  return {
    minRow,
    maxRow,
    minCol,
    maxCol,
    width,
    height,
    cellCount: width * height,
  }
}

export function clearVisualSelection(state: GameState): void {
  state.inputMode = "normal"
  state.visualAnchor = null
}

function forEachSelectionCell(
  state: GameState,
  selection: VisualSelection,
  visit: (cell: GardenCell, row: number, col: number) => boolean | void,
): void {
  outer: for (let row = selection.minRow; row <= selection.maxRow; row++) {
    for (let col = selection.minCol; col <= selection.maxCol; col++) {
      const cell = state.grid[row]?.[col]
      if (!cell) {
        continue
      }

      if (visit(cell, row, col) === false) {
        break outer
      }
    }
  }
}

function isPlantReady(cell: GardenCell): boolean {
  if (!cell.plant || cell.plant.isDead) {
    return false
  }

  const def = getPlantDef(cell.plant.type)
  return cell.plant.stageIndex >= def.stages.length - 1
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

export function doBulkPlant(state: GameState, type: PlantType): void {
  const selection = getVisualSelection(state)
  if (!selection) {
    clearVisualSelection(state)
    setStatusMessage(state, "No active visual selection.")
    return
  }

  state.selectedTool = "seed"
  const def = getPlantDef(type)

  let emptyPlots = 0
  let lockedPlots = 0
  forEachSelectionCell(state, selection, (cell) => {
    if (!cell.plant) {
      emptyPlots++
      if (!cell.unlocked) {
        lockedPlots++
      }
    }
  })

  const unlockedEmptyPlots = emptyPlots - lockedPlots
  if (unlockedEmptyPlots <= 0) {
    clearVisualSelection(state)
    setStatusMessage(state, emptyPlots > 0 ? "All empty plots in selection are locked." : "No empty plots in selection.")
    return
  }

  let planted = 0
  let hitGoldLimit = false
  forEachSelectionCell(state, selection, (cell, row, col) => {
    if (cell.plant || !cell.unlocked) {
      return
    }

    if (state.gold < def.cost) {
      hitGoldLimit = true
      return false
    }

    if (!plantSeed(state, row, col, type)) {
      planted++
    }
  })

  clearVisualSelection(state)

  if (planted === 0 && hitGoldLimit) {
    setStatusMessage(state, `Not enough gold to plant ${def.name} seeds.`)
    return
  }

  const suffix = planted === 1 ? "seed" : "seeds"
  const details: string[] = []
  if (hitGoldLimit) {
    details.push("not enough gold")
  }
  if (lockedPlots > 0) {
    details.push(`${lockedPlots} locked`)
  }

  const base = `Planted ${planted}/${unlockedEmptyPlots} ${def.name} ${suffix}`
  setStatusMessage(state, `${base}${details.length > 0 ? ` (${details.join(", ")})` : ""}.`)
}

export function doBulkWater(state: GameState): void {
  const selection = getVisualSelection(state)
  if (!selection) {
    clearVisualSelection(state)
    setStatusMessage(state, "No active visual selection.")
    return
  }

  state.selectedTool = "water"
  let targets = 0
  let watered = 0

  forEachSelectionCell(state, selection, (cell, row, col) => {
    if (!cell.plant || cell.plant.isDead || isPlantReady(cell)) {
      return
    }

    targets++
    if (!waterCell(state, row, col)) {
      watered++
    }
  })

  clearVisualSelection(state)

  if (targets === 0) {
    setStatusMessage(state, "No growing plants to water in selection.")
    return
  }

  setStatusMessage(state, `Watered ${watered} plant${watered === 1 ? "" : "s"}.`)
}

export function doBulkHarvest(state: GameState): void {
  const selection = getVisualSelection(state)
  if (!selection) {
    clearVisualSelection(state)
    setStatusMessage(state, "No active visual selection.")
    return
  }

  state.selectedTool = "harvest"

  let harvested = 0
  let clearedDead = 0
  let goldGained = 0

  forEachSelectionCell(state, selection, (cell, row, col) => {
    if (!cell.plant) {
      return
    }

    if (cell.plant.isDead) {
      if (harvestCell(state, row, col)) {
        clearedDead++
      }
      return
    }

    if (!isPlantReady(cell)) {
      return
    }

    const goldBefore = state.gold
    if (harvestCell(state, row, col)) {
      harvested++
      goldGained += state.gold - goldBefore
    }
  })

  clearVisualSelection(state)

  if (harvested === 0 && clearedDead === 0) {
    setStatusMessage(state, "No ready or dead plants in selection.")
    return
  }

  const parts: string[] = []
  if (harvested > 0) {
    parts.push(`Harvested ${harvested} (+${goldGained}g)`)
  }
  if (clearedDead > 0) {
    parts.push(`cleared ${clearedDead} dead`)
  }

  setStatusMessage(state, `${parts.join(", ")}.`)
}

export function doBulkDelete(state: GameState): void {
  const selection = getVisualSelection(state)
  if (!selection) {
    clearVisualSelection(state)
    setStatusMessage(state, "No active visual selection.")
    return
  }

  state.selectedTool = "harvest"
  let cleared = 0

  forEachSelectionCell(state, selection, (cell) => {
    if (!cell.plant) {
      return
    }

    cell.plant = null
    cell.soilState = "dry"
    cleared++
  })

  clearVisualSelection(state)

  if (cleared === 0) {
    setStatusMessage(state, "Nothing to clear in selection.")
    return
  }

  setStatusMessage(state, `Cleared ${cleared} plot${cleared === 1 ? "" : "s"}.`)
}

export function doBulkInteract(state: GameState): void {
  const selection = getVisualSelection(state)
  if (!selection) {
    clearVisualSelection(state)
    setStatusMessage(state, "No active visual selection.")
    return
  }

  const seedDef = getPlantDef(state.selectedSeed)

  let planted = 0
  let watered = 0
  let harvested = 0
  let clearedDead = 0
  let lockedEmpty = 0
  let noGoldEmpty = 0
  let goldGained = 0

  forEachSelectionCell(state, selection, (cell, row, col) => {
    if (!cell.plant) {
      if (!cell.unlocked) {
        lockedEmpty++
        return
      }

      if (state.gold < seedDef.cost) {
        noGoldEmpty++
        return
      }

      if (!plantSeed(state, row, col, state.selectedSeed)) {
        planted++
      }
      return
    }

    if (cell.plant.isDead) {
      if (harvestCell(state, row, col)) {
        clearedDead++
      }
      return
    }

    if (isPlantReady(cell)) {
      const goldBefore = state.gold
      if (harvestCell(state, row, col)) {
        harvested++
        goldGained += state.gold - goldBefore
      }
      return
    }

    if (!waterCell(state, row, col)) {
      watered++
    }
  })

  if (harvested > 0 || clearedDead > 0) {
    state.selectedTool = "harvest"
  } else if (watered > 0) {
    state.selectedTool = "water"
  } else if (planted > 0) {
    state.selectedTool = "seed"
  }

  clearVisualSelection(state)

  const parts: string[] = []
  if (planted > 0) {
    parts.push(`planted ${planted}`)
  }
  if (watered > 0) {
    parts.push(`watered ${watered}`)
  }
  if (harvested > 0) {
    parts.push(`harvested ${harvested} (+${goldGained}g)`)
  }
  if (clearedDead > 0) {
    parts.push(`cleared ${clearedDead} dead`)
  }
  if (noGoldEmpty > 0) {
    parts.push(`skipped ${noGoldEmpty} empty (no gold)`)
  }
  if (lockedEmpty > 0) {
    parts.push(`skipped ${lockedEmpty} locked`)
  }

  if (parts.length === 0) {
    setStatusMessage(state, "No applicable actions in selection.")
    return
  }

  const [first, ...rest] = parts
  if (!first) {
    setStatusMessage(state, "No applicable actions in selection.")
    return
  }

  setStatusMessage(state, `${first.charAt(0).toUpperCase()}${first.slice(1)}${rest.length > 0 ? `, ${rest.join(", ")}` : ""}.`)
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
