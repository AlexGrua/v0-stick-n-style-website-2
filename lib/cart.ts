// Backward-compatible Cart module with improved session clearing and versioning.
// Provides: buildVariantKey, subscribeCart, addToCart, updateCartItem, removeCartItem,
// getCart, setCart, clearCart, cartTotals, variantKeyFor.

export type CartItem = {
  // product identity
  id: string
  sku: string
  name: string
  category?: string
  sub?: string

  // variant selections
  color?: string
  size?: string
  thickness?: string

  // logistics (per box metrics and quantities)
  qtyBoxes: number
  pcsPerBox: number
  boxKg: number
  boxM3: number

  // presentation
  thumbnailUrl?: string

  // meta
  addedAt: number
  variantKey: string
}

type CartState = {
  version: string
  items: CartItem[]
}

const KEY = "sns_cart_v3"
const VERSION = "3"
const SESSION_FLAG = "sns_cart_session_cleared_v3"

// ---------- Utils ----------
function toNum(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}
function toInt(v: unknown, fallback = 0) {
  const n = Number.parseInt(String(v ?? ""), 10)
  return Number.isFinite(n) ? n : fallback
}
function computeVariantKey(p: { id: string; color?: string; size?: string; thickness?: string }) {
  const c = (p.color || "").trim().toLowerCase()
  const s = (p.size || "").trim().toLowerCase()
  const t = (p.thickness || "").trim().toLowerCase()
  return [p.id, c, s, t].join("|")
}

// Back-compat export name
export function buildVariantKey(id: string, color?: string, size?: string, thickness?: string) {
  return computeVariantKey({ id, color, size, thickness })
}
export function variantKeyFor(item: Pick<CartItem, "id" | "color" | "size" | "thickness">) {
  return computeVariantKey(item)
}

let recentQtyChangeTs = 0
export function getRecentQtyChangeTs() {
  return recentQtyChangeTs
}

// ---------- Persistence ----------
function read(): CartState {
  if (typeof window === "undefined") return { version: VERSION, items: [] }

  try {
    // Always start empty once per browser session
    if (!sessionStorage.getItem(SESSION_FLAG)) {
      localStorage.removeItem(KEY)
      sessionStorage.setItem(SESSION_FLAG, "1")
    }

    const raw = localStorage.getItem(KEY)
    if (!raw) return { version: VERSION, items: [] }
    const parsed = JSON.parse(raw) as CartState
    if (!parsed?.version || parsed.version !== VERSION) {
      localStorage.removeItem(KEY)
      return { version: VERSION, items: [] }
    }

    // Normalize items
    const items = Array.isArray(parsed.items) ? parsed.items.map(normalizeItem).filter(Boolean) : []
    return { version: VERSION, items: items as CartItem[] }
  } catch {
    return { version: VERSION, items: [] }
  }
}

function write(state: CartState) {
  if (typeof window === "undefined") return
  // Final normalize
  const normalized = state.items.map(normalizeItem).filter(Boolean) as CartItem[]
  const payload: CartState = { version: VERSION, items: normalized }
  localStorage.setItem(KEY, JSON.stringify(payload))
  // Notify listeners (custom event)
  window.dispatchEvent(new CustomEvent("sns:cart-updated"))
}

function normalizeItem(raw: any): CartItem | null {
  if (!raw || !raw.id || !raw.name) return null
  const qtyBoxes = toInt(raw.qtyBoxes, 0)
  const pcsPerBox = toInt(raw.pcsPerBox, 0)
  const boxKg = toNum(raw.boxKg, 0)
  const boxM3 = toNum(raw.boxM3, 0)
  const variantKey =
    raw.variantKey || computeVariantKey({ id: raw.id, color: raw.color, size: raw.size, thickness: raw.thickness })
  return {
    id: String(raw.id),
    sku: String(raw.sku ?? ""),
    name: String(raw.name),
    category: raw.category ? String(raw.category) : undefined,
    sub: raw.sub ? String(raw.sub) : undefined,
    color: raw.color ? String(raw.color) : undefined,
    size: raw.size ? String(raw.size) : undefined,
    thickness: raw.thickness ? String(raw.thickness) : undefined,
    qtyBoxes,
    pcsPerBox,
    boxKg,
    boxM3,
    thumbnailUrl: raw.thumbnailUrl ? String(raw.thumbnailUrl) : undefined,
    addedAt: toInt(raw.addedAt, Date.now()),
    variantKey,
  }
}

// ---------- Public API (back-compat) ----------
export function getCart(): CartItem[] {
  return read().items
}

export function setCart(items: CartItem[]) {
  const state = read()
  write({ ...state, items })
}

export function clearCart() {
  write({ version: VERSION, items: [] })
}

export function addToCart(item: Omit<CartItem, "variantKey">) {
  const state = read()
  const variantKey = computeVariantKey({
    id: item.id,
    color: item.color,
    size: item.size,
    thickness: item.thickness,
  })
  const idx = state.items.findIndex((it) => it.variantKey === variantKey)
  const now = Date.now()

  if (idx >= 0) {
    const mergedQty = toInt(state.items[idx].qtyBoxes, 0) + toInt(item.qtyBoxes, 0)
    state.items[idx] = {
      ...state.items[idx],
      qtyBoxes: mergedQty,
      // keep existing metrics; assume static per SKU
    }
    recentQtyChangeTs = Date.now()
  } else {
    state.items.push({
      ...item,
      addedAt: toInt(item.addedAt, now),
      variantKey,
      qtyBoxes: toInt(item.qtyBoxes, 0),
      pcsPerBox: toInt(item.pcsPerBox, 0),
      boxKg: toNum(item.boxKg, 0),
      boxM3: toNum(item.boxM3, 0),
    })
    recentQtyChangeTs = Date.now()
  }

  write(state)
  return state.items
}

export function updateCartItem(variantKey: string, patch: Partial<CartItem>) {
  const state = read()
  const idx = state.items.findIndex((it) => it.variantKey === variantKey)
  if (idx === -1) return state.items

  const cur = state.items[idx]
  const next: CartItem = {
    ...cur,
    ...patch,
  }

  // Sanitize numerics
  next.qtyBoxes = toInt(next.qtyBoxes, 0)
  next.pcsPerBox = toInt(next.pcsPerBox, 0)
  next.boxKg = toNum(next.boxKg, 0)
  next.boxM3 = toNum(next.boxM3, 0)

  // Recompute key if variant changed
  const newKey = computeVariantKey({ id: next.id, color: next.color, size: next.size, thickness: next.thickness })
  next.variantKey = newKey

  // Remove the old item
  state.items.splice(idx, 1)

  if (next.qtyBoxes > 0) {
    const mergeIdx = state.items.findIndex((it) => it.variantKey === newKey)
    if (mergeIdx >= 0) {
      // Merge quantities if same variant exists
      state.items[mergeIdx] = {
        ...state.items[mergeIdx],
        qtyBoxes: toInt(state.items[mergeIdx].qtyBoxes, 0) + toInt(next.qtyBoxes, 0),
      }
    } else {
      state.items.push(next)
    }
  }

  recentQtyChangeTs = Date.now()
  write(state)
  return state.items
}

export function removeCartItem(variantKey: string) {
  const state = read()
  const next = state.items.filter((it) => it.variantKey !== variantKey)
  recentQtyChangeTs = Date.now()
  write({ ...state, items: next })
  return next
}

export function cartTotals(items: CartItem[]) {
  const safe = (items || []).map(normalizeItem).filter(Boolean) as CartItem[]
  const totalBoxes = safe.reduce((a, x) => a + toInt(x.qtyBoxes, 0), 0)
  const totalPcs = safe.reduce((a, x) => a + toInt(x.qtyBoxes, 0) * toInt(x.pcsPerBox, 0), 0)
  const totalKg = safe.reduce((a, x) => a + toInt(x.qtyBoxes, 0) * toNum(x.boxKg, 0), 0)
  const totalM3 = safe.reduce((a, x) => a + toInt(x.qtyBoxes, 0) * toNum(x.boxM3, 0), 0)
  return { totalBoxes, totalPcs, totalKg, totalM3 }
}

// Back-compat subscription API
type CartListener = (items: CartItem[]) => void
const internalListeners = new Set<CartListener>()

export function subscribeCart(listener: CartListener) {
  internalListeners.add(listener)

  function notify() {
    const items = getCart()
    for (const l of internalListeners) l(items)
  }

  // Emit current snapshot
  listener(getCart())

  // Listen to our custom event and to cross-tab storage events
  const onCustom = () => notify()
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) notify()
  }

  if (typeof window !== "undefined") {
    window.addEventListener("sns:cart-updated", onCustom as EventListener)
    window.addEventListener("storage", onStorage)
  }

  return () => {
    internalListeners.delete(listener)
    if (typeof window !== "undefined") {
      window.removeEventListener("sns:cart-updated", onCustom as EventListener)
      window.removeEventListener("storage", onStorage)
    }
  }
}
