import type { GameState, PlantType } from "./types.ts"
import {
  moveCursor,
  doPlant,
  doWater,
  doHarvest,
  doNextDay,
  doInteract,
  setStatusMessage,
} from "./game.ts"
import { getPlantDef } from "./plants.ts"
import { buyFromShop, getShopItems } from "./shop.ts"

const SEED_KEYS: Record<string, PlantType> = {
  "1": "carrot",
  "2": "sunflower",
  "3": "tomato",
  "4": "rose",
  "5": "mushroom",
  "6": "pumpkin",
}

export interface KeyEvent {
  name: string
  ctrl: boolean
  shift: boolean
  meta: boolean
  option: boolean
  sequence: string
}

export function handleKeypress(
  state: GameState,
  key: KeyEvent,
  onQuit: () => void,
): void {
  // Quit
  if (key.name === "q" || (key.ctrl && key.name === "c")) {
    onQuit()
    return
  }

  // Shop mode
  if (state.shopOpen) {
    handleShopInput(state, key)
    return
  }

  // Movement (arrow keys only)
  switch (key.name) {
    case "up":
      moveCursor(state, -1, 0)
      return
    case "down":
      moveCursor(state, 1, 0)
      return
    case "left":
      moveCursor(state, 0, -1)
      return
    case "right":
      moveCursor(state, 0, 1)
      return
  }

  // Actions
  switch (key.name) {
    case "space":
    case "return":
      doInteract(state)
      return

    case "w":
      // Water
      state.selectedTool = "water"
      doWater(state)
      return

    case "e":
      // Quick plant with selected seed
      state.selectedTool = "seed"
      doPlant(state, state.selectedSeed)
      return

    case "h":
      // Harvest
      state.selectedTool = "harvest"
      doHarvest(state)
      return

    case "n":
      doNextDay(state)
      return

    case "s":
      state.shopOpen = true
      state.shopCursor = 0
      setStatusMessage(state, "Shop opened. Use Up/Down to browse, Enter to buy.", 5000)
      return

    case "t":
      state.autoAdvance = !state.autoAdvance
      setStatusMessage(
        state,
        state.autoAdvance ? "Auto-advance ON" : "Auto-advance OFF",
        2000,
      )
      return

    case "p":
      state.paused = !state.paused
      setStatusMessage(
        state,
        state.paused ? "Game paused" : "Game resumed",
        2000,
      )
      return
  }

  // Number keys for seed selection
  const seedType = SEED_KEYS[key.name]
  if (seedType) {
    state.selectedSeed = seedType
    state.selectedTool = "seed"
    const def = getPlantDef(seedType)
    setStatusMessage(state, `Selected ${def.name} seeds (${def.cost}g). Press [Space] to plant.`)
    return
  }

  // Function keys for tools
  if (key.name === "f1") {
    state.selectedTool = "hand"
    setStatusMessage(state, "Tool: Inspect - Press Space to check a cell.", 2000)
  } else if (key.name === "f2") {
    state.selectedTool = "water"
    setStatusMessage(state, "Tool: Water - Press Space to water a plant.", 2000)
  } else if (key.name === "f3") {
    state.selectedTool = "seed"
    setStatusMessage(state, "Tool: Plant - Press Space to plant selected seed.", 2000)
  } else if (key.name === "f4") {
    state.selectedTool = "harvest"
    setStatusMessage(state, "Tool: Harvest - Press Space to harvest a ready plant.", 2000)
  }
}

function handleShopInput(state: GameState, key: KeyEvent): void {
  const items = getShopItems()

  switch (key.name) {
    case "up":
      state.shopCursor = Math.max(0, state.shopCursor - 1)
      return

    case "down":
      state.shopCursor = Math.min(items.length - 1, state.shopCursor + 1)
      return

    case "return":
    case "space": {
      const result = buyFromShop(state, state.shopCursor)
      if (result.seed) {
        state.selectedSeed = result.seed
        state.selectedTool = "seed"
        state.shopOpen = false
        setStatusMessage(state, result.message)
      } else {
        setStatusMessage(state, result.message)
      }
      return
    }

    case "s":
    case "escape":
      state.shopOpen = false
      setStatusMessage(state, "Shop closed.", 1500)
      return
  }
}
