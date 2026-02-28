import type { GameState } from "./types.ts"
import {
  moveCursor,
  doPlant,
  doDelete,
  doNextDay,
  doInteract,
  doBulkInteract,
  setStatusMessage,
} from "./game.ts"
import { getShopItems, selectSeedFromMenu } from "./shop.ts"

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
  if (isCtrlC(key)) {
    if (state.inputMode === "normal" && !state.shopOpen && !state.visualAnchor && state.commandBuffer.length === 0) {
      onQuit()
      return
    }

    returnToNormalMode(state)
    setStatusMessage(state, "Returned to normal mode.", 1500)
    return
  }

  syncModeFromState(state)

  if (state.inputMode === "shop") {
    state.pendingMotionPrefix = ""
    handleShopInput(state, key)
    return
  }

  if (state.inputMode === "command") {
    state.pendingMotionPrefix = ""
    handleCommandInput(state, key, onQuit)
    return
  }

  if (state.inputMode === "visual") {
    handleVisualInput(state, key)
    return
  }

  handleNormalInput(state, key)
}

function handleNormalInput(state: GameState, key: KeyEvent): void {
  if (handleVimRowMotions(state, key)) {
    return
  }

  if (isJumpToRowStartKey(key)) {
    moveCursorToCol(state, 0)
    return
  }

  if (isJumpToRowEndKey(key)) {
    moveCursorToCol(state, state.gridCols - 1)
    return
  }

  switch (key.name) {
    case "up":
    case "k":
      moveCursor(state, -1, 0)
      return
    case "down":
    case "j":
      moveCursor(state, 1, 0)
      return
    case "left":
    case "h":
      moveCursor(state, 0, -1)
      return
    case "right":
    case "l":
      moveCursor(state, 0, 1)
      return
    case "w":
      moveCursorWordForward(state)
      return
    case "b":
      moveCursorWordBackward(state)
      return
    case "v":
      state.inputMode = "visual"
      state.visualAnchor = { row: state.cursorRow, col: state.cursorCol }
      setStatusMessage(state, "Visual mode: select a block, then press [Space] for smart action.", 2500)
      return
  }

  if (key.sequence === ":" || key.name === ":") {
    state.inputMode = "command"
    state.commandBuffer = ""
    return
  }

  switch (key.name) {
    case "space":
    case "enter":
    case "return":
      doInteract(state)
      return

    case "e":
      state.selectedTool = "seed"
      doPlant(state, state.selectedSeed)
      return

    case "x":
      doDelete(state)
      return

    case "n":
      doNextDay(state)
      return

    case "s":
      state.shopOpen = true
      state.shopCursor = 0
      state.inputMode = "shop"
      state.visualAnchor = null
      setStatusMessage(state, "Seed menu opened. Use J/K to browse, Enter to select.", 5000)
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

}

function handleVisualInput(state: GameState, key: KeyEvent): void {
  if (handleVimRowMotions(state, key)) {
    return
  }

  if (isJumpToRowStartKey(key)) {
    moveCursorToCol(state, 0)
    return
  }

  if (isJumpToRowEndKey(key)) {
    moveCursorToCol(state, state.gridCols - 1)
    return
  }

  switch (key.name) {
    case "up":
    case "k":
      moveCursor(state, -1, 0)
      return
    case "down":
    case "j":
      moveCursor(state, 1, 0)
      return
    case "left":
    case "h":
      moveCursor(state, 0, -1)
      return
    case "right":
    case "l":
      moveCursor(state, 0, 1)
      return
    case "w":
      moveCursorWordForward(state)
      return
    case "b":
      moveCursorWordBackward(state)
      return
    case "escape":
    case "v":
      state.inputMode = "normal"
      state.visualAnchor = null
      setStatusMessage(state, "Visual selection canceled.", 1500)
      return
    case "space":
    case "enter":
    case "return":
      doBulkInteract(state)
      return
    case "s":
      state.shopOpen = true
      state.shopCursor = 0
      state.inputMode = "shop"
      state.visualAnchor = null
      setStatusMessage(state, "Seed menu opened. Use J/K to browse, Enter to select.", 5000)
      return
  }
}

function isJumpToRowStartKey(key: KeyEvent): boolean {
  return key.name === "home" || (key.name === "0" && !key.shift)
}

function isJumpToRowEndKey(key: KeyEvent): boolean {
  return (
    key.name === "end" ||
    key.name === "$" ||
    key.sequence === "$" ||
    (key.shift && key.name === "4")
  )
}

function handleVimRowMotions(state: GameState, key: KeyEvent): boolean {
  if (isJumpToBottomRowKey(key)) {
    state.pendingMotionPrefix = ""
    moveCursorToRow(state, state.gridRows - 1)
    return true
  }

  if (isLowercaseGKey(key)) {
    if (state.pendingMotionPrefix === "g") {
      state.pendingMotionPrefix = ""
      moveCursorToRow(state, 0)
    } else {
      state.pendingMotionPrefix = "g"
    }
    return true
  }

  state.pendingMotionPrefix = ""
  return false
}

function isJumpToBottomRowKey(key: KeyEvent): boolean {
  return key.sequence === "G" || (key.shift && key.name === "g")
}

function isLowercaseGKey(key: KeyEvent): boolean {
  return key.sequence === "g" || (key.name === "g" && !key.shift)
}

function moveCursorToRow(state: GameState, row: number): void {
  state.cursorRow = Math.max(0, Math.min(state.gridRows - 1, row))
}

function moveCursorToCol(state: GameState, col: number): void {
  state.cursorCol = Math.max(0, Math.min(state.gridCols - 1, col))
}

function cellHasPlant(state: GameState, col: number): boolean {
  return Boolean(state.grid[state.cursorRow]?.[col]?.plant)
}

function moveCursorWordForward(state: GameState): void {
  const lastCol = state.gridCols - 1
  if (state.cursorCol >= lastCol) {
    return
  }

  let col = state.cursorCol
  if (cellHasPlant(state, col)) {
    while (col <= lastCol && cellHasPlant(state, col)) {
      col++
    }
  }

  while (col <= lastCol && !cellHasPlant(state, col)) {
    col++
  }

  moveCursorToCol(state, col > lastCol ? lastCol : col)
}

function moveCursorWordBackward(state: GameState): void {
  if (state.cursorCol <= 0) {
    moveCursorToCol(state, 0)
    return
  }

  let col = state.cursorCol - 1
  while (col >= 0 && !cellHasPlant(state, col)) {
    col--
  }

  if (col < 0) {
    moveCursorToCol(state, 0)
    return
  }

  while (col > 0 && cellHasPlant(state, col - 1)) {
    col--
  }

  moveCursorToCol(state, col)
}

function handleShopInput(state: GameState, key: KeyEvent): void {
  const items = getShopItems()

  switch (key.name) {
    case "up":
    case "k":
      state.shopCursor = Math.max(0, state.shopCursor - 1)
      return

    case "down":
    case "j":
      state.shopCursor = Math.min(items.length - 1, state.shopCursor + 1)
      return

    case "return":
    case "space": {
      const result = selectSeedFromMenu(state.shopCursor)
      if (result.seed) {
        state.selectedSeed = result.seed
        state.selectedTool = "seed"
        state.shopOpen = false
        state.inputMode = "normal"
        setStatusMessage(state, result.message)
      } else {
        setStatusMessage(state, result.message)
      }
      return
    }

    case "q":
    case "s":
    case "escape":
      state.shopOpen = false
      state.inputMode = "normal"
      setStatusMessage(state, "Seed menu closed.", 1500)
      return
  }
}

function handleCommandInput(state: GameState, key: KeyEvent, onQuit: () => void): void {
  switch (key.name) {
    case "escape":
      state.inputMode = "normal"
      state.commandBuffer = ""
      return

    case "backspace":
    case "delete":
      if (state.commandBuffer.length > 0) {
        state.commandBuffer = state.commandBuffer.slice(0, -1)
      } else {
        state.inputMode = "normal"
      }
      return

    case "return":
      executeCommand(state, onQuit)
      return
  }

  if (isPrintableInput(key)) {
    state.commandBuffer += key.sequence
  }
}

function executeCommand(state: GameState, onQuit: () => void): void {
  const command = state.commandBuffer.trim()
  state.commandBuffer = ""
  state.inputMode = "normal"

  if (command === "q" || command === "q!" || command === "quit") {
    onQuit()
    return
  }

  if (command.length === 0) {
    return
  }

  setStatusMessage(state, `Not an editor command: :${command}`, 2500)
}

function isPrintableInput(key: KeyEvent): boolean {
  return (
    !key.ctrl &&
    !key.meta &&
    !key.option &&
    typeof key.sequence === "string" &&
    key.sequence.length === 1 &&
    key.sequence >= " " &&
    key.sequence !== "\x7f"
  )
}

function isCtrlC(key: KeyEvent): boolean {
  return (key.ctrl && key.name === "c") || key.sequence === "\u0003"
}

function returnToNormalMode(state: GameState): void {
  state.shopOpen = false
  state.inputMode = "normal"
  state.commandBuffer = ""
  state.pendingMotionPrefix = ""
  state.visualAnchor = null
}

function syncModeFromState(state: GameState): void {
  if (state.shopOpen && state.inputMode !== "shop") {
    state.inputMode = "shop"
    state.commandBuffer = ""
    state.pendingMotionPrefix = ""
    state.visualAnchor = null
    return
  }

  if (!state.shopOpen && state.inputMode === "shop") {
    state.inputMode = "normal"
  }
}
