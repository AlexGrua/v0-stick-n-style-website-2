import { z } from "zod"

export type BlockType = "hero" | "categoryGrid" | "about" | "footerCta"

const HeroSchema = z.object({
  title: z.string().default("Premium panels and flooring for modern interiors"),
  subtitle: z
    .string()
    .default(
      "Build wholesale orders in minutes. Track boxes, kg, m³. Export to PDF/Excel and streamline your back-office.",
    ),
  body: z.string().optional(),
  backgroundImage: z.string().optional(), // URL or data URL
  ctas: z
    .array(z.object({ label: z.string().default("Create Now"), href: z.string().default("/create-n-order") }))
    .default([{ label: "Create Now", href: "/create-n-order" }]),
})

const CategoryItemSchema = z.object({
  categoryId: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(), // URL or data URL
  href: z.string().optional(),
})

const CategoryGridSchema = z.object({
  items: z.array(CategoryItemSchema).default([]),
})

const AboutSchema = z.object({
  title: z.string().default("About Stick'N'Style"),
  description: z
    .string()
    .default(
      "We help designers and wholesalers create beautiful, functional interiors with premium 3D wall panels, flooring, and adhesive solutions.",
    ),
  paragraphs: z.array(z.string()).default([]),
  features: z
    .array(
      z.object({
        title: z.string(),
        text: z.string(),
        icon: z.string().optional(),
      }),
    )
    .default([
      { title: "Wholesale‑ready", text: "Box, KG, m³ — all tracked and summarized." },
      { title: "Export to PDF/Excel", text: "Share and archive orders instantly." },
      { title: "Admin control", text: "Manage products, categories, and specs." },
    ]),
  backgroundImage: z.string().optional(),
})

const FooterCtaSchema = z.object({
  title: z.string().default("Create an order in 1 click"),
  subtitle: z.string().optional(),
  body: z.string().optional(),
  button: z.object({ label: z.string().default("Create Now"), href: z.string().default("/create-n-order") }),
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
  isActive: boolean
  data: T extends "hero"
    ? HeroData
    : T extends "categoryGrid"
      ? CategoryGridData
      : T extends "about"
        ? AboutData
        : FooterCtaData
}

export type HomeContent = {
  updatedAt: string
  blocks: Block[]
}

function uuid() {
  return (
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  ) as string
}

function nowISO() {
  return new Date().toISOString()
}

export function defaultHome(): HomeContent {
  const blocks: Block[] = [
    { id: uuid(), type: "hero", position: 0, isActive: true, data: HeroSchema.parse({}) },
    { id: uuid(), type: "categoryGrid", position: 1, isActive: true, data: CategoryGridSchema.parse({ items: [] }) },
    { id: uuid(), type: "about", position: 2, isActive: true, data: AboutSchema.parse({}) },
    { id: uuid(), type: "footerCta", position: 3, isActive: true, data: FooterCtaSchema.parse({}) },
  ]
  return { updatedAt: nowISO(), blocks }
}

export function validateBlock(type: BlockType, data: any): BlockData {
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

export function normalizeHome(input: any): HomeContent {
  const incoming = input as Partial<HomeContent>
  const blocks = Array.isArray(incoming.blocks) ? incoming.blocks : []
  const normalized: Block[] = blocks
    .map((b, i) => {
      const type = (b as any).type as BlockType
      const data = validateBlock(type, (b as any).data)
      return {
        id: (b as any).id || uuid(),
        type,
        position: typeof (b as any).position === "number" ? (b as any).position : i,
        isActive: (b as any).isActive ?? true,
        data,
      } as Block
    })
    .sort((a, b) => a.position - b.position)
  return { updatedAt: nowISO(), blocks: normalized }
}

// In-memory published snapshot
let published: HomeContent | null = null

export function getPublished(): HomeContent | null {
  return published
}

export function setPublished(next: HomeContent) {
  published = normalizeHome(next)
  return published
}
