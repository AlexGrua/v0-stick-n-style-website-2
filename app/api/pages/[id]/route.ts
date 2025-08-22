import { NextResponse } from "next/server"
import type { Page } from "@/lib/types"

const KEY = "__PAGES_IN_MEMORY__"

function nowISO() {
  return new Date().toISOString()
}

function getStore(): Page[] {
  // @ts-expect-error attach to global for reuse across modules
  if (!globalThis[KEY]) {
    // @ts-expect-error
    globalThis[KEY] = []
  }
  // @ts-expect-error
  return globalThis[KEY] as Page[]
}

function seed() {
  // Ensure the list endpoint seeds first-load defaults if not present.
  const store = getStore()
  if (store.length === 0) {
    // Minimal seed with Home, so PUTs won't fail on empty store.
    store.push({
      id: "home",
      title: "Home",
      path: "/",
      visible: true,
      order: 1,
      content: "",
      seoTitle: "Stick'N'Style — Home",
      seoDescription: "B2B catalog and Create'N'Order.",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })
  }
}

function findIndex(id: string) {
  const store = getStore()
  return store.findIndex((p) => p.id === id)
}

// GET /api/pages/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  seed()
  const store = getStore()
  const idx = store.findIndex((p) => p.id === params.id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(store[idx])
}

// PUT /api/pages/:id
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  seed()
  const store = getStore()
  const body = (await req.json()) as Partial<Page>
  const idx = findIndex(params.id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Prevent duplicated path across other pages
  if (body.path && store.some((p, i) => i !== idx && p.path === body.path)) {
    return NextResponse.json({ error: "A page with this path already exists" }, { status: 400 })
  }

  const prev = store[idx]
  const updated: Page = {
    ...prev,
    ...body,
    updatedAt: nowISO(),
  }
  store[idx] = updated
  return NextResponse.json(updated)
}

// DELETE /api/pages/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  seed()
  const store = getStore()
  const idx = findIndex(params.id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
  store.splice(idx, 1)
  return NextResponse.json({ ok: true })
}
