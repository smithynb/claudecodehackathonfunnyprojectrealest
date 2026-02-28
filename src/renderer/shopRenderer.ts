import { RGBA } from "@opentui/core"
import type { GameState } from "../types.ts"
import { SHOP_ITEMS } from "../plants.ts"
import type { GardenFrameBufferLike } from "./gardenRenderer.ts"

const SHOP_BG = RGBA.fromHex("#1A1A2E")
const SHOP_BORDER = RGBA.fromHex("#E94560")
const SHOP_TITLE = RGBA.fromHex("#FFD600")
const ITEM_COLOR = RGBA.fromHex("#FFFFFF")
const ITEM_DESC = RGBA.fromHex("#AAAAAA")
const ITEM_COST = RGBA.fromHex("#FFD600")
const SELECTED_BG = RGBA.fromHex("#3A3A5C")
const SELECTED_COLOR = RGBA.fromHex("#80DEEA")
const CANT_AFFORD = RGBA.fromHex("#EF5350")
const HELP_COLOR = RGBA.fromHex("#666666")

export const SHOP_WIDTH = 42
export const SHOP_HEIGHT_PER_ITEM = 2
export const SHOP_PADDING = 2

export function getShopHeight(): number {
  return SHOP_ITEMS.length * SHOP_HEIGHT_PER_ITEM + SHOP_PADDING * 2 + 4
}

export function renderShop(
  fb: GardenFrameBufferLike,
  state: GameState,
  centerX: number,
  centerY: number,
): void {
  const shopH = getShopHeight()
  const x0 = centerX - Math.floor(SHOP_WIDTH / 2)
  const y0 = centerY - Math.floor(shopH / 2)

  // Background
  fb.fillRect(x0, y0, SHOP_WIDTH, shopH, SHOP_BG)

  // Border
  for (let x = x0; x < x0 + SHOP_WIDTH; x++) {
    fb.setCell(x, y0, "=", SHOP_BORDER, SHOP_BG)
    fb.setCell(x, y0 + shopH - 1, "=", SHOP_BORDER, SHOP_BG)
  }
  for (let y = y0; y < y0 + shopH; y++) {
    fb.setCell(x0, y, "|", SHOP_BORDER, SHOP_BG)
    fb.setCell(x0 + SHOP_WIDTH - 1, y, "|", SHOP_BORDER, SHOP_BG)
  }
  fb.setCell(x0, y0, "+", SHOP_BORDER, SHOP_BG)
  fb.setCell(x0 + SHOP_WIDTH - 1, y0, "+", SHOP_BORDER, SHOP_BG)
  fb.setCell(x0, y0 + shopH - 1, "+", SHOP_BORDER, SHOP_BG)
  fb.setCell(x0 + SHOP_WIDTH - 1, y0 + shopH - 1, "+", SHOP_BORDER, SHOP_BG)

  // Title
  const title = " SEED SHOP "
  const titleX = x0 + Math.floor((SHOP_WIDTH - title.length) / 2)
  fb.drawText(title, titleX, y0, SHOP_TITLE, SHOP_BG)

  // Gold display
  const goldStr = `Your gold: ${state.gold}g`
  fb.drawText(goldStr, x0 + 2, y0 + 1, ITEM_COST, SHOP_BG)

  // Items
  for (let i = 0; i < SHOP_ITEMS.length; i++) {
    const item = SHOP_ITEMS[i]!
    const isSelected = i === state.shopCursor
    const canAfford = state.gold >= item.cost
    const iy = y0 + SHOP_PADDING + 1 + i * SHOP_HEIGHT_PER_ITEM

    // Highlight selected row
    if (isSelected) {
      fb.fillRect(x0 + 1, iy, SHOP_WIDTH - 2, SHOP_HEIGHT_PER_ITEM, SELECTED_BG)
    }

    // Cursor indicator
    const indicator = isSelected ? ">" : " "
    fb.drawText(indicator, x0 + 2, iy, SELECTED_COLOR, isSelected ? SELECTED_BG : SHOP_BG)

    // Item name
    const nameColor = isSelected ? SELECTED_COLOR : ITEM_COLOR
    fb.drawText(item.name, x0 + 4, iy, nameColor, isSelected ? SELECTED_BG : SHOP_BG)

    // Cost
    const costStr = `${item.cost}g`
    const costColor = canAfford ? ITEM_COST : CANT_AFFORD
    fb.drawText(costStr, x0 + SHOP_WIDTH - costStr.length - 3, iy, costColor, isSelected ? SELECTED_BG : SHOP_BG)

    // Description
    fb.drawText(
      item.description,
      x0 + 4,
      iy + 1,
      ITEM_DESC,
      isSelected ? SELECTED_BG : SHOP_BG,
    )
  }

  // Help text
  const helpY = y0 + shopH - 2
  fb.drawText("[j/k] Navigate  [Enter] Buy  [Esc/q] Close", x0 + 2, helpY, HELP_COLOR, SHOP_BG)
}
