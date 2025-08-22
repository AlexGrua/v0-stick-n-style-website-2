import { NextResponse } from "next/server"
import { db, seed } from "@/lib/db"

function toSlug(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  seed()
  const { categories } = db()
  const item = categories.find((c) => c.id === params.id)
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  seed()
  const state = db()
  const idx = state.categories.findIndex((c) => c.id === params.id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const patch = await req.json().catch(() => ({}))
  const now = new Date().toISOString()

  const next = { ...state.categories[idx], ...patch, updatedAt: now }

  // If name changed and slug not explicitly provided, update slug
  if (patch?.name && !patch?.slug) {
    const base = toSlug(String(patch.name))
    const existingSlugs = new Set(state.categories.filter((_, i) => i !== idx).map((c) => c.slug))
    let slug = base
    if (existingSlugs.has(slug)) {
      let i = 2
      while (existingSlugs.has(`${slug}-${i}`)) i++
      slug = `${slug}-${i}`
    }
    next.slug = slug
  }

  // Normalize subs if provided as array of strings
  if (Array.isArray(patch?.subs)) {
    next.subs = patch.subs.map((s: any) => (typeof s === "string" ? { id: crypto.randomUUID(), name: s } : s))
  }

  state.categories[idx] = next
  return NextResponse.json(state.categories[idx])
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  seed()
  const state = db()
  const idx = state.categories.findIndex((c) => c.id === params.id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
  state.categories.splice(idx, 1)
  return new NextResponse(null, { status: 204 })
}
