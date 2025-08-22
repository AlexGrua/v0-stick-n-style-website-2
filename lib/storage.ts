export type Persistable = Record<string, any>

declare global {
  // eslint-disable-next-line no-var
  var __snsMemoryStore: { [key: string]: any } | undefined
}

function getStore() {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function ensureMem() {
  if (!globalThis.__snsMemoryStore) {
    globalThis.__snsMemoryStore = Object.create(null)
  }
  return globalThis.__snsMemoryStore!
}

export function getJSON<T = unknown>(key: string, fallback: T): T {
  const ls = getStore()
  if (ls) {
    const raw = ls.getItem(key)
    if (raw) {
      try {
        return JSON.parse(raw) as T
      } catch {
        // corrupt -> reset
        ls.removeItem(key)
      }
    }
  }
  // memory fallback
  const mem = ensureMem()
  if (key in mem) return mem[key] as T
  mem[key] = fallback
  return fallback
}

export function setJSON<T = unknown>(key: string, val: T) {
  const ls = getStore()
  const mem = ensureMem()
  mem[key] = val
  if (ls) {
    try {
      ls.setItem(key, JSON.stringify(val))
    } catch {
      // ignore quota errors, keep memory only
    }
  }
}

export function slugify(input: string): string {
  return (input || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function matchCategory(filter: string, candidate: string) {
  if (!filter) return true
  const f1 = (filter || "").trim()
  const c1 = (candidate || "").trim()
  if (!f1 || !c1) return false
  if (f1.toLowerCase() === c1.toLowerCase()) return true
  return slugify(f1) === slugify(c1)
}

export type StoredProduct = {
  id: string
  sku: string
  name: string
  description?: string
  category: string // slug or name
  sub: string // name or slug, we match both via slugify
  thickness?: string[]
  sizes?: string[]
  pcsPerBox: number
  boxKg: number
  boxM3: number
  minOrderBoxes?: number
  status: "active" | "inactive" | "discontinued"
  tags?: string[]
  customFields?: Record<string, any>
  thumbnailUrl?: string
  gallery?: string[]
  stockLevel?: number
  version?: number
  createdAt: string
  updatedAt: string
  technicalDescription?: string
  photos?: { main?: string; others?: string[] }
  infographics?: { main?: string; others?: string[] }
  colors?: Array<{ id?: string; nameEn?: string; mainImage?: string }>
}

export type StoredCategory = {
  id: string
  name: string
  slug: string
  subs: Array<{ id?: string; name: string }>
  createdAt: string
  updatedAt: string
}

const PRODUCTS_KEY = "sns_products"
const CATEGORIES_KEY = "sns_categories"

export function loadProducts(): StoredProduct[] {
  return getJSON<StoredProduct[]>(PRODUCTS_KEY, [])
}
export function saveProducts(items: StoredProduct[]) {
  setJSON(PRODUCTS_KEY, items)
}

export function loadCategories(): StoredCategory[] {
  return getJSON<StoredCategory[]>(CATEGORIES_KEY, [])
}
export function saveCategories(items: StoredCategory[]) {
  setJSON(CATEGORIES_KEY, items)
}

export function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  return "id_" + Math.random().toString(36).slice(2)
}

export function nowISO() {
  return new Date().toISOString()
}
