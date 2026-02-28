import { RGBA } from "@opentui/core"
import type { GameState } from "../types.ts"
import type { GardenFrameBufferLike } from "./gardenRenderer.ts"

const STATUS_BG = RGBA.fromHex("#16213E")
const STATUS_BORDER = RGBA.fromHex("#0F3460")
const MESSAGE_COLOR = RGBA.fromHex("#FFFFFF")
const HELP_COLOR = RGBA.fromHex("#666666")
const KEY_COLOR = RGBA.fromHex("#80DEEA")

export const STATUS_HEIGHT = 4

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

  if (state.statusMessage) {
    drawClippedText(fb, state.statusMessage, 2, offsetY + 1, MESSAGE_COLOR, STATUS_BG, width - 4)
  }

  const helpLine1: ShortcutItem[] = [
    { key: "Arrows", label: "Move" },
    { key: "Space", label: "Interact" },
    { key: "W", label: "Water" },
    { key: "E", label: "Plant" },
    { key: "H", label: "Harvest" },
  ]

  const helpLine2: ShortcutItem[] = [
    { key: "1-6", label: "Seeds" },
    { key: "S", label: "Shop" },
    { key: "N", label: "Next Day" },
    { key: "T", label: `Auto:${state.autoAdvance ? "ON" : "OFF"}` },
    { key: "Q", label: "Quit" },
  ]

  renderShortcutRow(fb, helpLine1, width, offsetY + 2)
  renderShortcutRow(fb, helpLine2, width, offsetY + 3)
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

  const innerWidth = width - 2
  const columnWidth = Math.max(1, Math.floor(innerWidth / items.length))

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item) {
      continue
    }

    const x = 1 + i * columnWidth
    const maxWidth = i === items.length - 1 ? width - x - 1 : columnWidth
    if (maxWidth <= 0) {
      continue
    }

    const keyText = `[${item.key}]`
    const keyWidth = drawClippedText(fb, keyText, x, y, KEY_COLOR, STATUS_BG, maxWidth)
    if (keyWidth >= maxWidth) {
      continue
    }

    drawClippedText(fb, ` ${item.label}`, x + keyWidth, y, HELP_COLOR, STATUS_BG, maxWidth - keyWidth)
  }
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
