import { RGBA } from "@opentui/core"
import type { GameState } from "../types.ts"
import type { GardenFrameBufferLike } from "./gardenRenderer.ts"

const STATUS_BG = RGBA.fromHex("#16213E")
const STATUS_BORDER = RGBA.fromHex("#0F3460")
const MESSAGE_COLOR = RGBA.fromHex("#FFFFFF")
const HELP_COLOR = RGBA.fromHex("#666666")
const KEY_COLOR = RGBA.fromHex("#80DEEA")
const SEPARATOR_COLOR = RGBA.fromHex("#444444")

export const STATUS_HEIGHT = 4

export function renderStatus(
  fb: GardenFrameBufferLike,
  state: GameState,
  width: number,
  offsetY: number,
): void {
  // Background
  fb.fillRect(0, offsetY, width, STATUS_HEIGHT, STATUS_BG)

  // Top border
  for (let x = 0; x < width; x++) {
    fb.setCell(x, offsetY, "-", STATUS_BORDER, STATUS_BG)
  }

  // Status message
  if (state.statusMessage) {
    const msg = state.statusMessage.substring(0, width - 4)
    fb.drawText(msg, 2, offsetY + 1, MESSAGE_COLOR, STATUS_BG)
  }

  // Help line 1
  const helpLine1Parts: Array<[string, string]> = [
    ["[Arrows]", " Move"],
    ["  [Space]", " Interact"],
    ["  [W]", " Water"],
    ["  [E]", " Plant"],
    ["  [H]", " Harvest"],
  ]

  let hx = 1
  for (const [key, desc] of helpLine1Parts) {
    fb.drawText(key, hx, offsetY + 2, KEY_COLOR, STATUS_BG)
    hx += key.length
    fb.drawText(desc, hx, offsetY + 2, HELP_COLOR, STATUS_BG)
    hx += desc.length
  }

  // Help line 2
  const helpLine2Parts: Array<[string, string]> = [
    ["[1-6]", " Seeds"],
    ["  [S]", " Shop"],
    ["  [N]", " Next Day"],
    ["  [T]", " Auto:" + (state.autoAdvance ? "ON" : "OFF")],
    ["  [Q]", " Quit"],
  ]

  hx = 1
  for (const [key, desc] of helpLine2Parts) {
    fb.drawText(key, hx, offsetY + 3, KEY_COLOR, STATUS_BG)
    hx += key.length
    fb.drawText(desc, hx, offsetY + 3, HELP_COLOR, STATUS_BG)
    hx += desc.length
  }
}
