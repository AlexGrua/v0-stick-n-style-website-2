import type { CategoryKey } from "./types"

const CATEGORY_PREFIX: Record<CategoryKey, string> = {
  "wall-panel": "WP",
  flooring: "FL",
  adhesive: "AD",
  accessories: "AC",
}

const counters: Partial<Record<CategoryKey, number>> = {}

export function generateSku(category: CategoryKey) {
  const prefix = CATEGORY_PREFIX[category] ?? "PRD"
  counters[category] = (counters[category] ?? 0) + 1
  const n = `${counters[category]}`.padStart(4, "0")
  return `${prefix}-${n}`
}
