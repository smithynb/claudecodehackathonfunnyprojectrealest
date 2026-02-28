import type { PlantType } from "./types.ts"
import { SHOP_ITEMS } from "./plants.ts"

export function getShopItems() {
  return SHOP_ITEMS
}

export function selectSeedFromMenu(menuIndex: number): { seed: PlantType; message: string } | { seed: null; message: string } {
  const item = SHOP_ITEMS[menuIndex]
  if (!item) return { seed: null, message: "Invalid seed selection." }

  return { seed: item.type, message: `Selected ${item.name}. Press [Space] to plant.` }
}
