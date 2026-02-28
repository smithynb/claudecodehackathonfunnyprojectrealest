import { RGBA } from "@opentui/core"
import type { GameState } from "../types.ts"
import { getPlantDef } from "../plants.ts"
import type { GardenFrameBufferLike } from "./gardenRenderer.ts"

const STATUS_BG = RGBA.fromHex("#16213E")
const STATUS_BORDER = RGBA.fromHex("#0F3460")
const MESSAGE_COLOR = RGBA.fromHex("#FFFFFF")
const HELP_COLOR = RGBA.fromHex("#666666")
const KEY_COLOR = RGBA.fromHex("#80DEEA")
const MODE_COLOR = RGBA.fromHex("#FFD166")

export const STATUS_HEIGHT = 3

interface ShortcutItem {
  key: string
  label: string
}

export function renderStatus(
  fb: GardenFrameBufferLike,
  state: GameState,
  width: number,
  offsetY: number,
): void {
  fb.fillRect(0, offsetY, width, STATUS_HEIGHT, STATUS_BG)

  for (let x = 0; x < width; x++) {
    fb.setCell(x, offsetY, "-", STATUS_BORDER, STATUS_BG)
  }

  const modeLabel = getModeLabel(state)
  const modeDrawn = drawClippedText(fb, modeLabel, 1, offsetY + 1, MODE_COLOR, STATUS_BG, width - 2)

  if (state.statusMessage) {
    const messageX = Math.min(width - 1, modeDrawn + 3)
    drawClippedText(
      fb,
      state.statusMessage,
      messageX,
      offsetY + 1,
      MESSAGE_COLOR,
      STATUS_BG,
      width - messageX - 1,
    )
  }

  if (state.inputMode === "command") {
    renderCommandRow(fb, state, width, offsetY + 2)
  } else {
    renderShortcutRow(fb, getRelevantActions(state), width, offsetY + 2)
  }
}

function getRelevantActions(state: GameState): ShortcutItem[] {
  if (state.inputMode === "shop" || state.shopOpen) {
    return [
      { key: "j/k", label: "Browse" },
      { key: "Enter", label: "Buy" },
      { key: "Esc/Q", label: "Close" },
    ]
  }

  const actions: ShortcutItem[] = [
    { key: "hjkl", label: "Move" },
    { key: "w/b", label: "Word" },
    { key: "0/$", label: "Row" },
    { key: "Space", label: "Auto" },
  ]

  const cell = state.grid[state.cursorRow]?.[state.cursorCol]
  if (!cell?.plant) {
    actions.push({ key: "1-6", label: "Seeds" })
  } else if (cell.plant.isDead) {
    actions.push({ key: "X", label: "Clear" })
  } else {
    const def = getPlantDef(cell.plant.type)
    const isReady = cell.plant.stageIndex >= def.stages.length - 1
    if (isReady) {
      actions.push({ key: "X", label: "Harvest" })
    } else {
      actions.push({ key: "X", label: "Delete" })
    }
  }

  if (!state.autoAdvance) {
    actions.push({ key: "N", label: "Next Day" })
  }

  actions.push({ key: "T", label: `Auto:${state.autoAdvance ? "ON" : "OFF"}` })
  actions.push({ key: "S", label: "Shop" })
  actions.push({ key: ":q", label: "Quit" })

  return actions
}

function renderCommandRow(
  fb: GardenFrameBufferLike,
  state: GameState,
  width: number,
  y: number,
): void {
  if (width <= 2) {
    return
  }

  const promptX = 1
  fb.setCell(promptX, y, ":", KEY_COLOR, STATUS_BG)
  const commandText = `${state.commandBuffer}_`
  drawClippedText(fb, commandText, promptX + 1, y, MESSAGE_COLOR, STATUS_BG, width - promptX - 2)
}

function getModeLabel(state: GameState): string {
  if (state.inputMode === "command") {
    return "-- COMMAND --"
  }

  if (state.inputMode === "shop" || state.shopOpen) {
    return "-- SHOP --"
  }

  return "-- NORMAL --"
}

function renderShortcutRow(
  fb: GardenFrameBufferLike,
  items: ShortcutItem[],
  width: number,
  y: number,
): void {
  if (items.length === 0 || width <= 2) {
    return
  }

  let x = 1
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item) {
      continue
    }

    const maxWidth = width - x - 1
    if (maxWidth <= 0) {
      break
    }

    const keyText = `[${item.key}] ${item.label}${i === items.length - 1 ? "" : "  "}`
    const totalWidth = keyText.length
    const drawn = drawShortcutText(fb, keyText, x, y, maxWidth)
    x += drawn

    if (drawn < totalWidth) {
      break
    }
  }
}

function drawShortcutText(
  fb: GardenFrameBufferLike,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
): number {
  if (maxWidth <= 0) {
    return 0
  }

  let offset = 0
  let inKey = false
  for (let i = 0; i < text.length && offset < maxWidth; i++) {
    const ch = text[i]
    if (!ch) {
      continue
    }

    if (ch === "[") {
      inKey = true
    }

    const fg = inKey ? KEY_COLOR : HELP_COLOR
    fb.setCell(x + offset, y, ch, fg, STATUS_BG)

    if (ch === "]") {
      inKey = false
    }

    offset++
  }

  return offset
}

function drawClippedText(
  fb: GardenFrameBufferLike,
  text: string,
  x: number,
  y: number,
  fg: RGBA,
  bg: RGBA,
  maxWidth: number,
): number {
  if (maxWidth <= 0) {
    return 0
  }

  const clipped = text.substring(0, maxWidth)
  if (clipped.length === 0) {
    return 0
  }

  fb.drawText(clipped, x, y, fg, bg)
  return clipped.length
}
