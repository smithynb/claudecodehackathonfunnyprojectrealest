import { RGBA } from "@opentui/core"
import type { GameState } from "../types.ts"
import { getPlantDef } from "../plants.ts"
import { getSoilColor } from "../garden.ts"
import { EMPTY_CELL_SPRITE, DEAD_PLANT_SPRITE, getSoilChar } from "./sprites.ts"

/** Each cell in the garden grid is rendered as a CELL_W x CELL_H block */
export const CELL_W = 7
export const CELL_H = 5

/** Colors */
const CURSOR_BG = RGBA.fromHex("#3A3A5C")
const CURSOR_BORDER = RGBA.fromHex("#7C7CFF")
const GRID_BORDER = RGBA.fromHex("#555555")
const DEAD_COLOR = RGBA.fromHex("#888888")
const EMPTY_COLOR = RGBA.fromHex("#5D4037")
const BG_COLOR = RGBA.fromHex("#1A1A2E")

export interface GardenFrameBufferLike {
  setCell(x: number, y: number, char: string, fg: RGBA, bg: RGBA): void
  fillRect(x: number, y: number, w: number, h: number, color: RGBA): void
  drawText(text: string, x: number, y: number, fg: RGBA, bg?: RGBA): void
}

export function getGardenPixelSize(state: GameState): { width: number; height: number } {
  return {
    width: state.gridCols * CELL_W + 1,
    height: state.gridRows * CELL_H + 1,
  }
}

export function renderGarden(fb: GardenFrameBufferLike, state: GameState, offsetX: number = 0, offsetY: number = 0): void {
  const { gridRows, gridCols } = state

  // Clear the garden area
  fb.fillRect(
    offsetX,
    offsetY,
    gridCols * CELL_W + 1,
    gridRows * CELL_H + 1,
    BG_COLOR,
  )

  // Draw each cell
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const cell = state.grid[r]![c]!
      const cellX = offsetX + c * CELL_W
      const cellY = offsetY + r * CELL_H
      const isCursor = r === state.cursorRow && c === state.cursorCol

      // Cell background
      const soilBg = RGBA.fromHex(getSoilColor(cell.soilState))
      const cellBg = isCursor ? CURSOR_BG : soilBg

      // Fill cell interior
      fb.fillRect(cellX + 1, cellY + 1, CELL_W - 1, CELL_H - 1, cellBg)

      // Draw cell border
      const borderColor = isCursor ? CURSOR_BORDER : GRID_BORDER
      // Top border
      for (let x = cellX; x < cellX + CELL_W; x++) {
        fb.setCell(x, cellY, "-", borderColor, BG_COLOR)
      }
      // Left border
      for (let y = cellY; y < cellY + CELL_H; y++) {
        fb.setCell(cellX, y, "|", borderColor, BG_COLOR)
      }
      // Bottom border (last row)
      if (r === gridRows - 1) {
        for (let x = cellX; x < cellX + CELL_W; x++) {
          fb.setCell(x, cellY + CELL_H, "-", borderColor, BG_COLOR)
        }
      }
      // Right border (last col)
      if (c === gridCols - 1) {
        for (let y = cellY; y < cellY + CELL_H; y++) {
          fb.setCell(cellX + CELL_W, y, "|", borderColor, BG_COLOR)
        }
      }

      // Corner
      fb.setCell(cellX, cellY, "+", borderColor, BG_COLOR)
      if (r === gridRows - 1) {
        fb.setCell(cellX, cellY + CELL_H, "+", borderColor, BG_COLOR)
      }
      if (c === gridCols - 1) {
        fb.setCell(cellX + CELL_W, cellY, "+", borderColor, BG_COLOR)
        if (r === gridRows - 1) {
          fb.setCell(cellX + CELL_W, cellY + CELL_H, "+", borderColor, BG_COLOR)
        }
      }

      // Draw plant or empty indicator
      const spriteX = cellX + 1
      const spriteY = cellY + 1

      if (cell.plant) {
        const plant = cell.plant
        if (plant.isDead) {
          drawSprite(fb, DEAD_PLANT_SPRITE, spriteX, spriteY, DEAD_COLOR, cellBg)
        } else {
          const def = getPlantDef(plant.type)
          const stage = def.stages[plant.stageIndex]
          if (stage) {
            const color = RGBA.fromHex(stage.color)
            drawSprite(fb, stage.sprite, spriteX, spriteY, color, cellBg)
          }
        }

        // Water indicator bar at bottom of cell (1 row)
        const barY = spriteY + 3
        const barWidth = CELL_W - 2
        const filledWidth = Math.round(plant.waterLevel * barWidth)
        for (let i = 0; i < barWidth; i++) {
          if (i < filledWidth) {
            fb.setCell(spriteX + i, barY, "=", RGBA.fromHex("#42A5F5"), cellBg)
          } else {
            fb.setCell(spriteX + i, barY, "-", RGBA.fromHex("#333333"), cellBg)
          }
        }
      } else {
        // Empty cell - show soil pattern
        const soilChar = getSoilChar(cell.soilState)
        drawSprite(fb, EMPTY_CELL_SPRITE, spriteX, spriteY, EMPTY_COLOR, cellBg)
        // Soil texture on bottom row
        const soilY = spriteY + 3
        for (let i = 0; i < CELL_W - 2; i++) {
          fb.setCell(spriteX + i, soilY, soilChar, RGBA.fromHex("#795548"), cellBg)
        }
      }

      // Cursor highlight indicator
      if (isCursor) {
        fb.setCell(cellX + 1, cellY + 1, ">", CURSOR_BORDER, cellBg)
        fb.setCell(cellX + CELL_W - 2, cellY + 1, "<", CURSOR_BORDER, cellBg)
      }
    }
  }
}

function drawSprite(
  fb: GardenFrameBufferLike,
  sprite: [string, string, string],
  x: number,
  y: number,
  fg: RGBA,
  bg: RGBA,
): void {
  for (let row = 0; row < 3; row++) {
    const line = sprite[row]!
    for (let col = 0; col < line.length && col < CELL_W - 2; col++) {
      const ch = line[col]!
      if (ch !== " ") {
        fb.setCell(x + col, y + row, ch, fg, bg)
      }
    }
  }
}
