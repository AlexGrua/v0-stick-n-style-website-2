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

export async function GET() {
  // Ensure defaults (4 categories with subs) exist on first access
  seed()
  const { categories } = db()
  return NextResponse.json({ items: categories, total: categories.length })
}

export async function POST(req: Request) {
  seed()
  const state = db()
  const body = await req.json().catch(() => ({}))

  const name: string = (body.name || "").trim()
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  let slug = body.slug || toSlug(name)
  // ensure unique slug
  const existingSlugs = new Set(state.categories.map((c) => c.slug))
  if (existingSlugs.has(slug)) {
    let i = 2
    while (existingSlugs.has(`${slug}-${i}`)) i++
    slug = `${slug}-${i}`
  }

  const now = new Date().toISOString()
  const subsInput: string[] = Array.isArray(body.subs) ? body.subs : []
  const cat = {
    id: crypto.randomUUID(),
    name,
    slug,
    subs: subsInput.map((n) => ({ id: crypto.randomUUID(), name: String(n) })),
    createdAt: now,
    updatedAt: now,
  }

  state.categories.push(cat)
  return NextResponse.json(cat, { status: 201 })
}
