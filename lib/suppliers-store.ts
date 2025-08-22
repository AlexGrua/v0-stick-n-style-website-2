export type SupplierStatus = "approved" | "pending" | "blocked"

export type Supplier = {
  id: string
  shortName: string
  companyName: string
  contactPerson: string
  contactEmail?: string
  contactPhone?: string
  messenger?: string
  country?: string
  website?: string
  status: SupplierStatus
  categories: string[] // category slugs
  notes?: string
  createdAt?: string
  updatedAt?: string
}

type ListParams = {
  search?: string
  status?: SupplierStatus | "all"
}

function nowISO() {
  return new Date().toISOString()
}

function seedDefaults(): Supplier[] {
  const t = nowISO()
  return [
    {
      id: "P1",
      shortName: "P1",
      companyName: "Supplier One LLC",
      contactPerson: "Alice Smith",
      contactEmail: "alice@supplier1.example",
      contactPhone: "+1 555 111 2222",
      website: "https://supplier-one.example",
      status: "approved",
      categories: [],
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "P2",
      shortName: "P2",
      companyName: "Shenzhen Supplier Two Co.",
      contactPerson: "李华",
      contactEmail: "lihua@supplier2.example",
      contactPhone: "+86 755 1234 5678",
      website: "https://supplier-two.example",
      status: "approved",
      categories: [],
      createdAt: t,
      updatedAt: t,
    },
  ]
}

// Module-global store: always reseeded to exactly 2 items on a fresh reload.
declare global {
  // eslint-disable-next-line no-var
  var __SUPPLIERS_STORE__: Supplier[] | undefined
}

/**
 * Returns the in-memory store. On a fresh load, reseeds to exactly two suppliers.
 * No persistence across reloads.
 */
function getStore(): Supplier[] {
  if (!globalThis.__SUPPLIERS_STORE__) {
    globalThis.__SUPPLIERS_STORE__ = seedDefaults()
  }
  return globalThis.__SUPPLIERS_STORE__!
}

/**
 * Resets the store to the default two suppliers.
 */
export function resetSuppliersToSeed() {
  globalThis.__SUPPLIERS_STORE__ = seedDefaults()
  return getStore()
}

export function listSuppliers(params: ListParams = {}) {
  const store = getStore()
  const q = (params.search || "").trim().toLowerCase()
  const status = params.status && params.status !== "all" ? params.status : undefined
  let items = store
  if (q) {
    items = items.filter((s) => {
      const hay = [
        s.id,
        s.shortName,
        s.companyName,
        s.contactPerson,
        s.contactEmail || "",
        s.contactPhone || "",
        s.website || "",
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }
  if (status) {
    items = items.filter((s) => s.status === status)
  }
  return { items, total: items.length }
}

export function getSupplier(id: string) {
  const store = getStore()
  return store.find((s) => s.id === id) || null
}

function validateRequired(input: Partial<Supplier>) {
  if (!input.id) throw new Error("ID is required")
  if (!/^[A-Za-z0-9\-_]+$/.test(input.id)) throw new Error("ID: only A-Z, 0-9, - and _")
  if (!input.shortName) throw new Error("Short Name is required")
  if (!input.companyName) throw new Error("Company Name is required")
  if (!input.contactPerson) throw new Error("Contact person is required")
  if (!input.categories || input.categories.length === 0) throw new Error("At least one Category must be selected")
}

export function createSupplier(input: Supplier) {
  const store = getStore()
  validateRequired(input)
  if (store.some((s) => s.id === input.id)) throw new Error("Supplier with this ID already exists")
  const payload: Supplier = {
    ...input,
    categories: Array.from(new Set(input.categories || [])),
    status: input.status || "approved",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  }
  store.unshift(payload)
  return payload
}

export function updateSupplier(id: string, patch: Partial<Supplier>) {
  const store = getStore()
  const idx = store.findIndex((s) => s.id === id)
  if (idx === -1) throw new Error("Supplier not found")
  const prev = store[idx]
  // Ensure required fields remain valid after patch
  const nextCandidate: Supplier = {
    ...prev,
    ...patch,
    id: prev.id, // ID immutable
  }
  validateRequired(nextCandidate)
  const next: Supplier = {
    ...nextCandidate,
    categories: patch.categories ? Array.from(new Set(patch.categories)) : prev.categories,
    updatedAt: nowISO(),
  }
  store[idx] = next
  return next
}

export function deleteSupplier(id: string) {
  const store = getStore()
  const idx = store.findIndex((s) => s.id === id)
  if (idx === -1) throw new Error("Supplier not found")
  store.splice(idx, 1)
  return { ok: true }
}
