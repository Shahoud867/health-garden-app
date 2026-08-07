import type { GoalType } from "./database.types"
import type { PlantType as FrontendPlantType } from "../components/PlantSVG"

/**
 * Bridges the backend's storage-layer plant naming (`garden_state.plant_type`
 * — mint/cactus/wheat_stalk/sapling/succulent, migration 0005) to the
 * frontend's presentation-layer art (`PlantSVG`'s cactus/sunflower/
 * bellflower/bamboo/succulent) — two different vocabularies for the same
 * five plants, reconciled here by the one key both layers share: `goal_type`.
 * This mapping isn't a guess: it reproduces exactly what the frontend's own
 * pre-integration mock data already paired (App.tsx's INITIAL_STATE.garden
 * before this round), so no visual identity changes for a real user, only
 * the data source underneath it.
 */
export const GOAL_TYPE_TO_PLANT: Record<GoalType, FrontendPlantType> = {
  hydration: "bellflower",
  sugar_free: "cactus",
  protein: "bamboo",
  movement: "sunflower",
  consistency: "succulent",
}

export const GOAL_TYPE_ORDER: GoalType[] = [
  "sugar_free",
  "movement",
  "hydration",
  "protein",
  "consistency",
]

export function goalLabel(goalType: GoalType, lang: "en" | "ur"): string {
  const labels: Record<GoalType, { en: string; ur: string }> = {
    hydration: { en: "Hydration", ur: "پانی" },
    sugar_free: { en: "Sugar-free days", ur: "شکر سے پاک دن" },
    protein: { en: "Protein", ur: "پروٹین" },
    movement: { en: "Movement", ur: "ورزش" },
    consistency: { en: "Consistency", ur: "مستقل مزاجی" },
  }
  return labels[goalType][lang]
}
