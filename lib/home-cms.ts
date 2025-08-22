import { z } from "zod"

// Types and Schemas
export type BlockType = "hero" | "categoryGrid" | "about" | "footerCta"

export const HeroSchema = z.object({
  title: z.string().default("Premium panels and flooring for modern interiors"),
  subtitle: z
    .string()
    .default(
      "Build wholesale orders in minutes. Track boxes, kg, m³. Export to PDF/Excel and streamline your back-office.",
    ),
  body: z.string().optional(),
  backgroundImage: z.string().optional(), // URL or data URL
  ctas: z
    .array(
      z.object({
        label: z.string().default("Create Now"),
        href: z.string().default("/create-n-order"),
      }),
    )
    .default([{ label: "Create Now", href: "/create-n-order" }]),
})

export const CategoryGridSchema = z.object({
  items: z
    .array(
      z.object({
        categoryId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(), // URL or data URL
        href: z.string().optional(),
      }),
    )
    .default([]),
})

export const AboutSchema = z.object({
  title: z.string().default("About Stick’N’Style"),
  description: z
    .string()
    .default(
      "We help designers and wholesalers create beautiful, functional interiors with premium 3D wall panels, flooring, and adhesive solutions.",
    ),
  paragraphs: z.array(z.string()).default([]),
  features: z
    .array(
      z.object({
        icon: z.string().optional(), // lucide icon name (optional)
        title: z.string(),
        text: z.string(),
      }),
    )
    .default([
      { title: "Wholesale-ready", text: "Box, KG, m³ — all tracked and summarized." },
      { title: "Export to PDF/Excel", text: "Share and archive orders instantly." },
      { title: "Admin control", text: "Manage products, categories, and specs." },
    ]),
  backgroundImage: z.string().optional(),
})

export const FooterCtaSchema = z.object({
  title: z.string().default("Create an order in 1 click"),
  subtitle: z.string().optional(),
  body: z.string().optional(),
  button: z
    .object({
      label: z.string().default("Create Now"),
      href: z.string().default("/create-n-order"),
    })
    .default({ label: "Create Now", href: "/create-n-order" }),
})

export type HeroData = z.infer<typeof HeroSchema>
export type CategoryGridData = z.infer<typeof CategoryGridSchema>
export type AboutData = z.infer<typeof AboutSchema>
export type FooterCtaData = z.infer<typeof FooterCtaSchema>
export type BlockData = HeroData | CategoryGridData | AboutData | FooterCtaData

export type Block<T extends BlockType = BlockType> = {
  id: string
  type: T
  position: number
  is_active: boolean
  data: T extends "hero"
    ? HeroData
    : T extends "categoryGrid"
      ? CategoryGridData
      : T extends "about"
        ? AboutData
        : FooterCtaData
}

export type PageModel = {
  id: string
  slug: "home"
  locale: "en"
  status: "draft" | "published"
  meta: { title?: string; description?: string; ogImage?: string }
  draftBlocks: Block[]
  publishedBlocks: Block[]
  updatedAt: string
  publishedAt?: string
}

type CMSState = {
  page: PageModel
}

const KEY = "__HOME_CMS_STATE__"

function nowISO() {
  return new Date().toISOString()
}
function uuid() {
  return (
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  ) as string
}

function defaultBlocks(): Block[] {
  return [
    {
      id: uuid(),
      type: "hero",
      position: 0,
      is_active: true,
      data: HeroSchema.parse({}),
    },
    {
      id: uuid(),
      type: "categoryGrid",
      position: 1,
      is_active: true,
      data: CategoryGridSchema.parse({ items: [] }),
    },
    {
      id: uuid(),
      type: "about",
      position: 2,
      is_active: true,
      data: AboutSchema.parse({}),
    },
    {
      id: uuid(),
      type: "footerCta",
      position: 3,
      is_active: true,
      data: FooterCtaSchema.parse({}),
    },
  ]
}

function validateByType(type: BlockType, data: any) {
  switch (type) {
    case "hero":
      return HeroSchema.parse({ ...(data || {}) })
    case "categoryGrid":
      return CategoryGridSchema.parse({ ...(data || {}) })
    case "about":
      return AboutSchema.parse({ ...(data || {}) })
    case "footerCta":
      return FooterCtaSchema.parse({ ...(data || {}) })
    default:
      return data
  }
}

export function getState(): CMSState {
  // @ts-expect-error attach to global
  if (!globalThis[KEY]) {
    const state: CMSState = {
      page: {
        id: uuid(),
        slug: "home",
        locale: "en",
        status: "draft",
        meta: { title: "Home", description: "Homepage" },
        draftBlocks: defaultBlocks(),
        publishedBlocks: [],
        updatedAt: nowISO(),
      },
    }
    // @ts-expect-error
    globalThis[KEY] = state
  }
  // @ts-expect-error
  return globalThis[KEY] as CMSState
}

// CRUD-like helpers
export function listHome(): PageModel {
  return getState().page
}

export function setDraftBlocks(blocks: Block[]) {
  const s = getState()
  const next = blocks
    .map((b, i) => ({
      ...b,
      position: typeof b.position === "number" ? b.position : i,
      data: validateByType(b.type, b.data),
    }))
    .sort((a, b) => a.position - b.position) as Block[]
  s.page.draftBlocks = next
  s.page.updatedAt = nowISO()
  return s.page
}

export function patchBlock(id: string, patch: Partial<Block>) {
  const s = getState()
  const idx = s.page.draftBlocks.findIndex((b) => b.id === id)
  if (idx === -1) throw new Error("Block not found")
  const b = s.page.draftBlocks[idx]
  const data = patch.data ? validateByType(b.type, { ...(b.data as any), ...(patch.data as any) }) : b.data
  const next = { ...b, ...patch, data } as Block
  s.page.draftBlocks[idx] = next
  s.page.updatedAt = nowISO()
  return next
}

export function reorderBlocks(order: string[]) {
  const s = getState()
  const map = new Map(s.page.draftBlocks.map((b) => [b.id, b]))
  const next: Block[] = []
  order.forEach((id, i) => {
    const b = map.get(id)
    if (b) next.push({ ...b, position: i })
  })
  s.page.draftBlocks.filter((b) => !order.includes(b.id)).forEach((b) => next.push({ ...b, position: next.length }))
  s.page.draftBlocks = next
  s.page.updatedAt = nowISO()
  return s.page.draftBlocks
}

export function updateMeta(meta: Partial<PageModel["meta"]>) {
  const s = getState()
  s.page.meta = { ...s.page.meta, ...meta }
  s.page.updatedAt = nowISO()
  return s.page
}

export function publishDraft() {
  const s = getState()
  s.page.publishedBlocks = s.page.draftBlocks.map((b) => ({ ...b }))
  s.page.status = "published"
  s.page.publishedAt = nowISO()
  s.page.updatedAt = nowISO()
  return s.page
}
