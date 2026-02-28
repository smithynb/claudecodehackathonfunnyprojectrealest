import type { GameState, PlantType } from "./types.ts"
import { SHOP_ITEMS } from "./plants.ts"

export function getShopItems() {
  return SHOP_ITEMS
}

export function buyFromShop(state: GameState, shopIndex: number): { seed: PlantType; message: string } | { seed: null; message: string } {
  const item = SHOP_ITEMS[shopIndex]
  if (!item) return { seed: null, message: "Invalid shop item." }

  if (state.gold < item.cost) {
    return { seed: null, message: `Not enough gold! Need ${item.cost}g, you have ${state.gold}g.` }
  }

  return { seed: item.type, message: `Selected ${item.name} (${item.cost}g). Place it in your garden!` }
}
