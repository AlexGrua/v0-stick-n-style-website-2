import { z } from "zod"

export type BlockType = "hero" | "categoryGrid" | "about" | "footerCta"

export const HeroSchema = z.object({
  title: z.string().default("Premium panels and flooring for modern interiors"),
  subtitle: z
    .string()
    .default(
      "Build wholesale orders in minutes. Track boxes, kg, m³. Export to PDF/Excel and streamline your back-office.",
    ),
  backgroundImage: z.string().optional(),
  ctas: z
    .array(
      z.object({
        label: z.string(),
        href: z.string().default("/create-n-order"),
        variant: z.enum(["primary", "outline"]).default("primary"),
      }),
    )
    .default([{ label: "Create Now", href: "/create-n-order", variant: "primary" }]),
})

export const CategoryGridSchema = z.object({
  items: z
    .array(
      z.object({
        categoryId: z.string(),
        title: z.string().optional(),
        image: z.string().optional(),
        href: z.string().optional(),
        description: z.string().optional(),
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
        icon: z.string().optional(),
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

export type PageStatus = "draft" | "published"

export type PageModel = {
  id: string
  slug: string
  locale: string
  status: PageStatus
  meta: { title?: string; description?: string; ogImage?: string }
  draftBlocks: Block[]
  publishedBlocks: Block[]
  updatedAt: string
  publishedAt?: string
}

export type MediaItem = {
  id: string
  url: string
  alt?: string
  type: "image"
  width?: number
  height?: number
  size?: number
  createdAt: string
}

type CMSState = {
  page: PageModel
  media: MediaItem[]
}

const KEY = "__LIGHT_CMS__"

function nowISO() {
  return new Date().toISOString()
}

function uuid() {
  return (
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  ) as string
}

function defaultBlocks(): Block[] {
  const blocks: Block[] = [
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
  return blocks
}

export function getCMS(): CMSState {
  // @ts-expect-error attach to global in Next.js/preview
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
      media: [],
    }
    // @ts-expect-error
    globalThis[KEY] = state
  }
  // @ts-expect-error
  return globalThis[KEY] as CMSState
}

export function listHome() {
  return getCMS().page
}

export function publishHome() {
  const s = getCMS()
  s.page.publishedBlocks = s.page.draftBlocks.map((b) => ({ ...b }))
  s.page.status = "published"
  s.page.publishedAt = nowISO()
  s.page.updatedAt = nowISO()
  return s.page
}

export function updateHomeMeta(meta: Partial<PageModel["meta"]>) {
  const s = getCMS()
  s.page.meta = { ...s.page.meta, ...meta }
  s.page.updatedAt = nowISO()
  return s.page
}

export function validateByType(type: BlockType, data: any): any {
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

export function patchSection(id: string, patch: Partial<Block>) {
  const s = getCMS()
  const i = s.page.draftBlocks.findIndex((b) => b.id === id)
  if (i === -1) throw new Error("Block not found")
  const block = s.page.draftBlocks[i]
  const next: Block = {
    ...block,
    ...patch,
    data: patch.data ? validateByType(block.type, { ...(block.data as any), ...(patch.data as any) }) : block.data,
  } as Block
  s.page.draftBlocks[i] = next
  s.page.updatedAt = nowISO()
  return next
}

export function reorderSections(orderIds: string[]) {
  const s = getCMS()
  const map = new Map(s.page.draftBlocks.map((b) => [b.id, b]))
  const next: Block[] = []
  orderIds.forEach((id, idx) => {
    const b = map.get(id)
    if (b) next.push({ ...b, position: idx })
  })
  s.page.draftBlocks.filter((b) => !orderIds.includes(b.id)).forEach((b) => next.push({ ...b, position: next.length }))
  s.page.draftBlocks = next
  s.page.updatedAt = nowISO()
  return s.page.draftBlocks
}

export function setDraftBlocks(blocks: Block[]) {
  const s = getCMS()
  const normalized = blocks
    .map((b, idx) => ({
      ...b,
      position: typeof b.position === "number" ? b.position : idx,
      data: validateByType(b.type, b.data),
    }))
    .sort((a, b) => a.position - b.position) as Block[]
  s.page.draftBlocks = normalized
  s.page.updatedAt = nowISO()
  return s.page
}

export function listMedia() {
  return getCMS().media
}

export function addMedia(item: Omit<MediaItem, "id" | "createdAt" | "type">) {
  const s = getCMS()
  const m: MediaItem = {
    id: uuid(),
    type: "image",
    createdAt: nowISO(),
    ...item,
  }
  s.media.push(m)
  return m
}
