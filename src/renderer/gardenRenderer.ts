import { RGBA } from "@opentui/core"
import type { GameState, GardenCell } from "../types.ts"
import { getPlantDef } from "../plants.ts"
import { getSoilColor } from "../garden.ts"
import { getVisualSelection } from "../game.ts"
import { EMPTY_CELL_SPRITE, DEAD_PLANT_SPRITE, getSoilChar } from "./sprites.ts"

const MAX_CELL_W = 7
const MAX_CELL_H = 5
const MIN_CELL_W = 3
const MIN_CELL_H = 2

const CURSOR_BG = RGBA.fromHex("#3A3A5C")
const CURSOR_BORDER = RGBA.fromHex("#7C7CFF")
const SELECTION_BG = RGBA.fromHex("#47375D")
const SELECTION_BORDER = RGBA.fromHex("#CC77FF")
const GRID_BORDER = RGBA.fromHex("#555555")
const DEAD_COLOR = RGBA.fromHex("#888888")
const EMPTY_COLOR = RGBA.fromHex("#5D4037")
const SOIL_COLOR = RGBA.fromHex("#795548")
const WATER_COLOR = RGBA.fromHex("#42A5F5")
const BG_COLOR = RGBA.fromHex("#1A1A2E")

export interface GardenFrameBufferLike {
  setCell(x: number, y: number, char: string, fg: RGBA, bg: RGBA): void
  fillRect(x: number, y: number, w: number, h: number, color: RGBA): void
  drawText(text: string, x: number, y: number, fg: RGBA, bg?: RGBA): void
}

export interface GardenLayout {
  cellWidth: number
  cellHeight: number
  width: number
  height: number
  isDetailed: boolean
}

export function getGardenPixelSize(
  state: GameState,
  cellWidth: number = MAX_CELL_W,
  cellHeight: number = MAX_CELL_H,
): { width: number; height: number } {
  const safeCellWidth = Math.max(MIN_CELL_W, Math.floor(cellWidth))
  const safeCellHeight = Math.max(MIN_CELL_H, Math.floor(cellHeight))

  return {
    width: state.gridCols * safeCellWidth + 1,
    height: state.gridRows * safeCellHeight + 1,
  }
}

export function getGardenLayout(
  state: GameState,
  maxWidth: number,
  maxHeight: number,
): GardenLayout | null {
  const availableWidth = Math.max(0, Math.floor(maxWidth))
  const availableHeight = Math.max(0, Math.floor(maxHeight))

  const maxCellWidth = Math.floor((availableWidth - 1) / state.gridCols)
  const maxCellHeight = Math.floor((availableHeight - 1) / state.gridRows)

  const cellWidth = Math.min(MAX_CELL_W, maxCellWidth)
  const cellHeight = Math.min(MAX_CELL_H, maxCellHeight)

  if (cellWidth < MIN_CELL_W || cellHeight < MIN_CELL_H) {
    return null
  }

  const size = getGardenPixelSize(state, cellWidth, cellHeight)
  return {
    cellWidth,
    cellHeight,
    width: size.width,
    height: size.height,
    isDetailed: cellWidth >= MAX_CELL_W && cellHeight >= MAX_CELL_H,
  }
}

export function renderGarden(
  fb: GardenFrameBufferLike,
  state: GameState,
  layout: GardenLayout,
  offsetX: number = 0,
  offsetY: number = 0,
): void {
  const { gridRows, gridCols } = state
  const { cellWidth, cellHeight, width, height, isDetailed } = layout
  const selection = getVisualSelection(state)

  fb.fillRect(offsetX, offsetY, width, height, BG_COLOR)

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const cell = state.grid[r]?.[c]
      if (!cell) continue

      const cellX = offsetX + c * cellWidth
      const cellY = offsetY + r * cellHeight
      const isCursor = r === state.cursorRow && c === state.cursorCol
      const isSelected =
        selection !== null &&
        r >= selection.minRow &&
        r <= selection.maxRow &&
        c >= selection.minCol &&
        c <= selection.maxCol

      const soilBg = RGBA.fromHex(getSoilColor(cell.soilState))
      const cellBg = isCursor ? CURSOR_BG : isSelected ? SELECTION_BG : soilBg

      const interiorX = cellX + 1
      const interiorY = cellY + 1
      const interiorWidth = Math.max(1, cellWidth - 1)
      const interiorHeight = Math.max(1, cellHeight - 1)

      fb.fillRect(interiorX, interiorY, interiorWidth, interiorHeight, cellBg)

      const borderColor = isCursor ? CURSOR_BORDER : isSelected ? SELECTION_BORDER : GRID_BORDER
      for (let x = cellX; x < cellX + cellWidth; x++) {
        fb.setCell(x, cellY, "-", borderColor, BG_COLOR)
      }
      for (let y = cellY; y < cellY + cellHeight; y++) {
        fb.setCell(cellX, y, "|", borderColor, BG_COLOR)
      }

      if (r === gridRows - 1) {
        for (let x = cellX; x < cellX + cellWidth; x++) {
          fb.setCell(x, cellY + cellHeight, "-", borderColor, BG_COLOR)
        }
      }

      if (c === gridCols - 1) {
        for (let y = cellY; y < cellY + cellHeight; y++) {
          fb.setCell(cellX + cellWidth, y, "|", borderColor, BG_COLOR)
        }
      }

      fb.setCell(cellX, cellY, "+", borderColor, BG_COLOR)
      if (r === gridRows - 1) {
        fb.setCell(cellX, cellY + cellHeight, "+", borderColor, BG_COLOR)
      }
      if (c === gridCols - 1) {
        fb.setCell(cellX + cellWidth, cellY, "+", borderColor, BG_COLOR)
        if (r === gridRows - 1) {
          fb.setCell(cellX + cellWidth, cellY + cellHeight, "+", borderColor, BG_COLOR)
        }
      }

      if (isDetailed && interiorWidth >= 5 && interiorHeight >= 4) {
        drawDetailedCell(fb, cell, interiorX, interiorY, interiorWidth, interiorHeight, cellBg)
      } else {
        drawCompactCell(fb, cell, interiorX, interiorY, interiorWidth, interiorHeight, cellBg)
      }

      if (isCursor) {
        fb.setCell(cellX + 1, cellY + 1, ">", CURSOR_BORDER, cellBg)
        if (cellWidth >= 4) {
          fb.setCell(cellX + cellWidth - 2, cellY + 1, "<", CURSOR_BORDER, cellBg)
        }
      }
    }
  }
}

function drawDetailedCell(
  fb: GardenFrameBufferLike,
  cell: GardenCell,
  x: number,
  y: number,
  width: number,
  height: number,
  bg: RGBA,
): void {
  const spriteX = x + Math.max(0, Math.floor((width - 5) / 2))
  const spriteY = y

  if (cell.plant) {
    const plant = cell.plant
    if (plant.isDead) {
      drawSprite(fb, DEAD_PLANT_SPRITE, spriteX, spriteY, DEAD_COLOR, bg, width, height)
    } else {
      const def = getPlantDef(plant.type)
      const stage = def.stages[plant.stageIndex]
      if (stage) {
        const color = RGBA.fromHex(stage.color)
        drawSprite(fb, stage.sprite, spriteX, spriteY, color, bg, width, height)
      }
    }

    drawWaterBar(fb, cell, x, y, width, height, bg)
    return
  }

  drawSprite(fb, EMPTY_CELL_SPRITE, spriteX, spriteY, EMPTY_COLOR, bg, width, height)
  const soilY = y + height - 1
  const soilChar = getSoilChar(cell.soilState)
  for (let i = 0; i < width; i++) {
    fb.setCell(x + i, soilY, soilChar, SOIL_COLOR, bg)
  }
}

function drawCompactCell(
  fb: GardenFrameBufferLike,
  cell: GardenCell,
  x: number,
  y: number,
  width: number,
  height: number,
  bg: RGBA,
): void {
  const centerX = x + Math.floor((width - 1) / 2)
  const centerY = y + Math.floor((height - 1) / 2)
  const { char, color } = getCompactGlyph(cell)

  fb.setCell(centerX, centerY, char, color, bg)

  if (cell.plant && height >= 3 && width >= 4) {
    drawWaterBar(fb, cell, x, y, width, height, bg)
  }
}

function drawWaterBar(
  fb: GardenFrameBufferLike,
  cell: GardenCell,
  x: number,
  y: number,
  width: number,
  height: number,
  bg: RGBA,
): void {
  if (!cell.plant || width < 3 || height < 2) {
    return
  }

  const barY = y + height - 1
  const filledWidth = Math.round(cell.plant.waterLevel * width)
  for (let i = 0; i < width; i++) {
    if (i < filledWidth) {
      fb.setCell(x + i, barY, "=", WATER_COLOR, bg)
    } else {
      fb.setCell(x + i, barY, "-", GRID_BORDER, bg)
    }
  }
}

function getCompactGlyph(cell: GardenCell): { char: string; color: RGBA } {
  if (!cell.plant) {
    return {
      char: getSoilChar(cell.soilState),
      color: SOIL_COLOR,
    }
  }

  if (cell.plant.isDead) {
    return {
      char: "x",
      color: DEAD_COLOR,
    }
  }

  const def = getPlantDef(cell.plant.type)
  const stage = def.stages[cell.plant.stageIndex]
  const char = stage ? getSpriteGlyph(stage.sprite) : "*"

  return {
    char,
    color: stage ? RGBA.fromHex(stage.color) : EMPTY_COLOR,
  }
}

function getSpriteGlyph(sprite: [string, string, string]): string {
  for (const line of sprite) {
    for (const char of line) {
      if (char !== " ") {
        return char
      }
    }
  }
  return "*"
}

function drawSprite(
  fb: GardenFrameBufferLike,
  sprite: [string, string, string],
  x: number,
  y: number,
  fg: RGBA,
  bg: RGBA,
  maxWidth: number,
  maxHeight: number,
): void {
  const maxRows = Math.min(3, maxHeight)
  for (let row = 0; row < maxRows; row++) {
    const line = sprite[row]!
    for (let col = 0; col < line.length && col < maxWidth; col++) {
      const ch = line[col]!
      if (ch !== " ") {
        fb.setCell(x + col, y + row, ch, fg, bg)
      }
    }
  }
}
