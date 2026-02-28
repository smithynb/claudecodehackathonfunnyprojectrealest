import type { PlantDefinition, PlantType, ShopItem } from "./types.ts"

export const PLANT_DEFINITIONS: Record<PlantType, PlantDefinition> = {
  carrot: {
    type: "carrot",
    name: "Carrot",
    cost: 5,
    sellValue: 15,
    growthDays: 3,
    waterNeed: "medium",
    preferredSeasons: ["spring", "fall"],
    stages: [
      {
        name: "seed",
        sprite: [
          "     ",
          "  .  ",
          " ___ ",
        ],
        color: "#8B6914",
      },
      {
        name: "sprout",
        sprite: [
          "  |  ",
          " \\|/ ",
          " ___ ",
        ],
        color: "#66BB6A",
      },
      {
        name: "growing",
        sprite: [
          " \\|/ ",
          " \\|/ ",
          " [|] ",
        ],
        color: "#43A047",
      },
      {
        name: "ready",
        sprite: [
          " \\~/ ",
          " \\|/ ",
          " {V} ",
        ],
        color: "#FF8C00",
      },
    ],
  },
  sunflower: {
    type: "sunflower",
    name: "Sunflower",
    cost: 10,
    sellValue: 30,
    growthDays: 5,
    waterNeed: "low",
    preferredSeasons: ["summer"],
    stages: [
      {
        name: "seed",
        sprite: [
          "     ",
          "  .  ",
          " ___ ",
        ],
        color: "#8B6914",
      },
      {
        name: "sprout",
        sprite: [
          "     ",
          "  |  ",
          " /|\\ ",
        ],
        color: "#66BB6A",
      },
      {
        name: "budding",
        sprite: [
          "  o  ",
          "  |  ",
          " /|\\ ",
        ],
        color: "#9CCC65",
      },
      {
        name: "blooming",
        sprite: [
          " \\@/ ",
          "  |  ",
          " /|\\ ",
        ],
        color: "#FFD600",
      },
    ],
  },
  tomato: {
    type: "tomato",
    name: "Tomato",
    cost: 8,
    sellValue: 25,
    growthDays: 4,
    waterNeed: "high",
    preferredSeasons: ["summer", "spring"],
    stages: [
      {
        name: "seed",
        sprite: [
          "     ",
          "  .  ",
          " ___ ",
        ],
        color: "#8B6914",
      },
      {
        name: "sprout",
        sprite: [
          "  ,  ",
          "  |  ",
          " /|\\ ",
        ],
        color: "#66BB6A",
      },
      {
        name: "flowering",
        sprite: [
          " *,* ",
          "  |  ",
          " /|\\ ",
        ],
        color: "#FFEE58",
      },
      {
        name: "fruiting",
        sprite: [
          " oOo ",
          "  |  ",
          " /|\\ ",
        ],
        color: "#EF5350",
      },
    ],
  },
  rose: {
    type: "rose",
    name: "Rose",
    cost: 15,
    sellValue: 50,
    growthDays: 6,
    waterNeed: "medium",
    preferredSeasons: ["spring", "summer"],
    stages: [
      {
        name: "seed",
        sprite: [
          "     ",
          "  .  ",
          " ___ ",
        ],
        color: "#8B6914",
      },
      {
        name: "sprout",
        sprite: [
          "     ",
          " }|{ ",
          " /|\\ ",
        ],
        color: "#66BB6A",
      },
      {
        name: "budding",
        sprite: [
          "  @  ",
          " }|{ ",
          " /|\\ ",
        ],
        color: "#E91E63",
      },
      {
        name: "blooming",
        sprite: [
          " (@) ",
          " }|{ ",
          " /|\\ ",
        ],
        color: "#FF1744",
      },
    ],
  },
  mushroom: {
    type: "mushroom",
    name: "Mushroom",
    cost: 3,
    sellValue: 10,
    growthDays: 2,
    waterNeed: "high",
    preferredSeasons: ["fall", "spring"],
    stages: [
      {
        name: "spore",
        sprite: [
          "     ",
          "  .  ",
          " ~~~ ",
        ],
        color: "#795548",
      },
      {
        name: "growing",
        sprite: [
          "     ",
          "  o  ",
          " ||| ",
        ],
        color: "#A1887F",
      },
      {
        name: "ready",
        sprite: [
          " _^_ ",
          " / \\ ",
          " ||| ",
        ],
        color: "#BCAAA4",
      },
    ],
  },
  pumpkin: {
    type: "pumpkin",
    name: "Pumpkin",
    cost: 20,
    sellValue: 80,
    growthDays: 8,
    waterNeed: "medium",
    preferredSeasons: ["fall"],
    stages: [
      {
        name: "seed",
        sprite: [
          "     ",
          "  .  ",
          " ___ ",
        ],
        color: "#8B6914",
      },
      {
        name: "sprout",
        sprite: [
          "  ,  ",
          "  |  ",
          " /~\\ ",
        ],
        color: "#66BB6A",
      },
      {
        name: "vine",
        sprite: [
          " ~,~ ",
          " ~|~ ",
          " /~\\ ",
        ],
        color: "#43A047",
      },
      {
        name: "growing",
        sprite: [
          " ~,~ ",
          " ~|~ ",
          " (o) ",
        ],
        color: "#FF9800",
      },
      {
        name: "ready",
        sprite: [
          " \\~/ ",
          " ~|~ ",
          " {O} ",
        ],
        color: "#FF6D00",
      },
    ],
  },
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    type: "carrot",
    name: "Carrot Seeds",
    cost: 5,
    description: "Quick grower. Best in spring/fall.",
  },
  {
    type: "sunflower",
    name: "Sunflower Seeds",
    cost: 10,
    description: "Low water needs. Loves summer.",
  },
  {
    type: "tomato",
    name: "Tomato Seeds",
    cost: 8,
    description: "Needs lots of water. Spring/summer.",
  },
  {
    type: "rose",
    name: "Rose Seeds",
    cost: 15,
    description: "Valuable! Best in spring/summer.",
  },
  {
    type: "mushroom",
    name: "Mushroom Spores",
    cost: 3,
    description: "Cheapest & fastest. Needs water.",
  },
  {
    type: "pumpkin",
    name: "Pumpkin Seeds",
    cost: 20,
    description: "Slow but very valuable. Fall crop.",
  },
]

export function getPlantDef(type: PlantType): PlantDefinition {
  return PLANT_DEFINITIONS[type]
}
