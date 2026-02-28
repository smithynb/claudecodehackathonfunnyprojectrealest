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
  // Background
  fb.fillRect(0, offsetY, width, HUD_HEIGHT, HUD_BG)

  // Border bottom
  for (let x = 0; x < width; x++) {
    fb.setCell(x, offsetY + HUD_HEIGHT - 1, "-", HUD_BORDER, HUD_BG)
  }

  // Title
  const title = " GARDEN SIMULATOR "
  fb.drawText(title, 1, offsetY, TITLE_COLOR, HUD_BG)

  // Day info
  const year = getYear(state.day)
  const dayInSeason = getDayInSeason(state.day)
  const seasonLabel = getSeasonLabel(state.season)
  const seasonColor = RGBA.fromHex(getSeasonColor(state.season))

  const dayStr = `Day ${state.day}`
  const yearStr = `Y${year}`
  fb.drawText(dayStr, 1, offsetY + 1, VALUE_COLOR, HUD_BG)
  fb.drawText(yearStr, dayStr.length + 2, offsetY + 1, LABEL_COLOR, HUD_BG)

  // Season
  const seasonStart = dayStr.length + yearStr.length + 4
  fb.drawText("Season:", seasonStart, offsetY + 1, LABEL_COLOR, HUD_BG)
  fb.drawText(`${seasonLabel} (${dayInSeason}/7)`, seasonStart + 8, offsetY + 1, seasonColor, HUD_BG)

  // Weather (on row 2 instead to avoid overlap with timer bar)
  const weatherLabel = getWeatherLabel(state.weather)
  const weatherColor = RGBA.fromHex(getWeatherColor(state.weather))

  // Gold
  const goldStr = `Gold: ${state.gold}g`
  fb.drawText(goldStr, 1, offsetY + 2, GOLD_COLOR, HUD_BG)

  // Weather after gold on row 2
  const weatherStart = goldStr.length + 3
  fb.drawText("Weather:", weatherStart, offsetY + 2, LABEL_COLOR, HUD_BG)
  fb.drawText(weatherLabel, weatherStart + 9, offsetY + 2, weatherColor, HUD_BG)

  // Tool
  const toolName = getToolName(state.selectedTool)
  let toolStr = `Tool: ${toolName}`
  if (state.selectedTool === "seed") {
    const seedDef = getPlantDef(state.selectedSeed)
    toolStr += ` (${seedDef.name})`
  }
  const toolStart = weatherStart + 9 + weatherLabel.length + 2
  fb.drawText(toolStr, toolStart, offsetY + 2, TOOL_COLOR, HUD_BG)

  // Day timer progress bar on right side of row 1 (if auto-advance)
  if (state.autoAdvance && !state.shopOpen) {
    const timerWidth = 12
    const progress = Math.min(1.0, state.dayTimer / state.dayDuration)
    const filled = Math.round(progress * timerWidth)
    const barX = width - timerWidth - 3
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

  // Stats on right side of row 2
  const statsStr = `H:${state.totalHarvested} E:${state.totalEarned}g`
  fb.drawText(statsStr, width - statsStr.length - 2, offsetY + 2, LABEL_COLOR, HUD_BG)
}
