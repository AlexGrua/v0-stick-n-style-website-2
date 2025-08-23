import { NextResponse } from "next/server"
import type { Page } from "@/lib/types"
import { requireRole } from "@/lib/api/guard"

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
  const store = getStore()
  if (store.length > 0) return

  const defaults: Page[] = [
    {
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
    },
    {
      id: "about",
      title: "About",
      path: "/about",
      visible: true,
      order: 2,
      content: "About our company.",
      seoTitle: "About Stick'N'Style",
      seoDescription: "Learn more about us.",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    {
      id: "contact",
      title: "Contact",
      path: "/contact",
      visible: true,
      order: 3,
      content: "Contact details and form.",
      seoTitle: "Contact Stick'N'Style",
      seoDescription: "Get in touch.",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    {
      id: "faqs",
      title: "FAQs",
      path: "/faqs",
      visible: true,
      order: 4,
      content: "Frequently asked questions.",
      seoTitle: "FAQs",
      seoDescription: "Common questions answered.",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
    {
      id: "catalog",
      title: "Catalog",
      path: "/catalog",
      visible: true,
      order: 5,
      content: "Browse our products.",
      seoTitle: "Catalog",
      seoDescription: "Browse categories and products.",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    },
  ]
  store.push(...defaults)
}

function sortPages(items: Page[]) {
  return [...items].sort((a, b) => (a.order || 9999) - (b.order || 9999) || a.title.localeCompare(b.title))
}

// GET /api/pages
export async function GET(req: Request) {
  seed()
  const store = getStore()
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("search") || "").toLowerCase()
  const includeHidden = searchParams.get("includeHidden") === "true"

  let items = store
  if (!includeHidden) items = items.filter((p) => p.visible)
  if (q) {
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.path.toLowerCase().includes(q) ||
        (p.seoTitle || "").toLowerCase().includes(q),
    )
  }

  return NextResponse.json({ items: sortPages(items) })
}

// POST /api/pages — create a new page
export async function POST(req: Request) {
  const guard = requireRole(req, "admin")
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status })
  }

  seed()
  const store = getStore()
  const body = (await req.json()) as Partial<Page>

  if (!body.title || !body.path) {
    return NextResponse.json({ error: "title and path are required" }, { status: 400 })
  }

  if (store.some((p) => p.path === body.path)) {
    return NextResponse.json({ error: "A page with this path already exists" }, { status: 400 })
  }

  const now = nowISO()
  const page: Page = {
    id: crypto.randomUUID(),
    title: body.title!,
    path: body.path!,
    visible: body.visible ?? true,
    order: body.order ?? (store.length ? Math.max(...store.map((p) => p.order || 0)) + 1 : 1),
    content: body.content ?? "",
    seoTitle: body.seoTitle ?? body.title ?? "",
    seoDescription: body.seoDescription ?? "",
    createdAt: now,
    updatedAt: now,
  }

  store.push(page)
  return NextResponse.json(page, { status: 201 })
}
