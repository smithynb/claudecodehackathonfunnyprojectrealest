import { RGBA } from "@opentui/core"
import type { GameState } from "../types.ts"
import { getSeasonLabel, getSeasonColor, getDayInSeason, getYear } from "../time.ts"
import { getWeatherLabel, getWeatherColor } from "../weather.ts"
import { getToolName } from "./sprites.ts"
import { getPlantDef } from "../plants.ts"
import type { GardenFrameBufferLike } from "./gardenRenderer.ts"

const HUD_BG = RGBA.fromHex("#16213E")
const HUD_BORDER = RGBA.fromHex("#0F3460")
const TITLE_COLOR = RGBA.fromHex("#E94560")
const LABEL_COLOR = RGBA.fromHex("#AAAAAA")
const VALUE_COLOR = RGBA.fromHex("#FFFFFF")
const GOLD_COLOR = RGBA.fromHex("#FFD600")
const TOOL_COLOR = RGBA.fromHex("#80DEEA")

export const HUD_HEIGHT = 4

export function renderHud(fb: GardenFrameBufferLike, state: GameState, width: number, offsetY: number = 0): void {
  fb.fillRect(0, offsetY, width, HUD_HEIGHT, HUD_BG)

  for (let x = 0; x < width; x++) {
    fb.setCell(x, offsetY + HUD_HEIGHT - 1, "-", HUD_BORDER, HUD_BG)
  }

  drawClippedText(fb, " GARDN ", 1, offsetY, TITLE_COLOR, HUD_BG, width - 2)

  const year = getYear(state.day)
  const dayInSeason = getDayInSeason(state.day)
  const seasonLabel = getSeasonLabel(state.season)
  const seasonColor = RGBA.fromHex(getSeasonColor(state.season))

  let row1X = 1
  row1X += drawClippedText(fb, `Day ${state.day}`, row1X, offsetY + 1, VALUE_COLOR, HUD_BG, width - row1X - 1)
  row1X += drawClippedText(fb, ` Y${year}`, row1X, offsetY + 1, LABEL_COLOR, HUD_BG, width - row1X - 1)

  row1X += drawClippedText(fb, "  Season:", row1X, offsetY + 1, LABEL_COLOR, HUD_BG, width - row1X - 1)
  drawClippedText(
    fb,
    ` ${seasonLabel} (${dayInSeason}/7)`,
    row1X,
    offsetY + 1,
    seasonColor,
    HUD_BG,
    width - row1X - 1,
  )

  const weatherLabel = getWeatherLabel(state.weather)
  const weatherColor = RGBA.fromHex(getWeatherColor(state.weather))

  let row2X = 1
  row2X += drawClippedText(fb, `Gold: ${state.gold}g`, row2X, offsetY + 2, GOLD_COLOR, HUD_BG, width - row2X - 1)
  row2X += drawClippedText(fb, "  Weather:", row2X, offsetY + 2, LABEL_COLOR, HUD_BG, width - row2X - 1)
  row2X += drawClippedText(fb, ` ${weatherLabel}`, row2X, offsetY + 2, weatherColor, HUD_BG, width - row2X - 1)

  const toolName = getToolName(state.selectedTool)
  let toolStr = `Tool: ${toolName}`
  if (state.selectedTool === "seed") {
    const seedDef = getPlantDef(state.selectedSeed)
    toolStr += ` (${seedDef.name})`
  }
  row2X += drawClippedText(fb, "  ", row2X, offsetY + 2, TOOL_COLOR, HUD_BG, width - row2X - 1)
  row2X += drawClippedText(fb, toolStr, row2X, offsetY + 2, TOOL_COLOR, HUD_BG, width - row2X - 1)

  if (state.autoAdvance && !state.shopOpen && state.inputMode !== "command") {
    const timerWidth = 12
    const progress = Math.min(1.0, state.dayTimer / state.dayDuration)
    const filled = Math.round(progress * timerWidth)
    const barX = width - timerWidth - 3
    if (barX > 1) {
      fb.drawText("[", barX, offsetY + 1, LABEL_COLOR, HUD_BG)
      for (let i = 0; i < timerWidth; i++) {
        if (i < filled) {
          fb.setCell(barX + 1 + i, offsetY + 1, "#", RGBA.fromHex("#66BB6A"), HUD_BG)
        } else {
          fb.setCell(barX + 1 + i, offsetY + 1, ".", RGBA.fromHex("#333333"), HUD_BG)
        }
      }
      fb.drawText("]", barX + timerWidth + 1, offsetY + 1, LABEL_COLOR, HUD_BG)
    }
  }

  const statsStr = `H:${state.totalHarvested} E:${state.totalEarned}g`
  const statsX = width - statsStr.length - 2
  if (statsX > row2X + 1) {
    fb.drawText(statsStr, statsX, offsetY + 2, LABEL_COLOR, HUD_BG)
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
