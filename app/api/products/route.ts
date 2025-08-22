import { NextResponse } from "next/server"
import { db, seed } from "@/lib/db"
import { generateSku } from "@/lib/sku"

function toSlug(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET(req: Request) {
  // Ensure defaults (4 products) exist on first access
  seed()
  const { products } = db()

  const url = new URL(req.url)
  const q = (url.searchParams.get("q") || "").trim().toLowerCase()
  const category = (url.searchParams.get("category") || "").trim()
  const sub = (url.searchParams.get("sub") || "").trim()

  let items = products.slice()

  if (q) {
    items = items.filter((p) => {
      const hay = [p.name, p.sku, p.category, p.sub, p.description ?? "", p.technicalDescription ?? ""]
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }

  if (category) {
    const catSlugOrName = toSlug(category)
    items = items.filter((p) => toSlug(p.category) === catSlugOrName || p.category === category)
  }

  if (sub) {
    const subSlugOrName = toSlug(sub)
    items = items.filter((p) => toSlug(p.sub) === subSlugOrName || p.sub === sub)
  }

  return NextResponse.json({ items, total: items.length })
}

export async function POST(req: Request) {
  seed()
  const state = db()
  const body = await req.json().catch(() => ({}))

  const now = new Date().toISOString()
  const id = crypto.randomUUID()

  // Minimal required fields with sensible defaults
  const name: string = body.name || "New Product"
  const category: string = body.category || "wall-panel"
  const sub: string = body.sub || "Sub 1"

  const product = {
    id,
    sku: body.sku || generateSku(category as any),
    name,
    description: body.description || "",
    technicalDescription: body.technicalDescription || "High-quality finish suitable for interiors.",
    photos: body.photos || { main: body.thumbnailUrl, others: [] },
    infographics: body.infographics || { main: "/abstract-geometric-shapes.png", others: [] },
    colors: body.colors || [
      {
        id: crypto.randomUUID(),
        nameEn: "White",
        nameRu: "Белый",
        photoUrl: "/swatches/white.png",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        nameEn: "Black",
        nameRu: "Черный",
        photoUrl: "/swatches/black.png",
        createdAt: now,
        updatedAt: now,
      },
    ],
    category,
    sub,
    thickness: body.thickness || ["2 mm"],
    sizes: body.sizes || ["60×60cm"],
    pcsPerBox: typeof body.pcsPerBox === "number" ? body.pcsPerBox : 50,
    boxKg: typeof body.boxKg === "number" ? body.boxKg : 31,
    boxM3: typeof body.boxM3 === "number" ? body.boxM3 : 1.2,
    minOrderBoxes: typeof body.minOrderBoxes === "number" ? body.minOrderBoxes : 1,
    status: body.status || "inactive", // as requested earlier, new defaults to inactive
    tags: Array.isArray(body.tags) ? body.tags : [],
    customFields: body.customFields || {},
    thumbnailUrl: body.thumbnailUrl,
    gallery: Array.isArray(body.gallery) ? body.gallery : [],
    stockLevel: typeof body.stockLevel === "number" ? body.stockLevel : 0,
    version: typeof body.version === "number" ? body.version : 1,
    createdAt: now,
    updatedAt: now,
  }

  state.products.unshift(product)
  return NextResponse.json(product, { status: 201 })
}
