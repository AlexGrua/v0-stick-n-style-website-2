import { z } from "zod"

export type SectionKey = "hero" | "categories" | "about" | "footerCta"

const HeroSchema = z.object({
  shown: z.boolean().default(true),
  title: z.string().default("Premium panels and flooring for modern interiors"),
  subtitle: z.string().default("Build wholesale orders in minutes. Track boxes, kg, m³. Export to PDF/Excel."),
  ctas: z
    .array(
      z.object({
        label: z.string().default("Create Now"),
        href: z.string().default("/create-n-order"),
      }),
    )
    .default([{ label: "Create Now", href: "/create-n-order" }]),
  image: z.string().optional(), // URL or data URL
})

const CategoriesSchema = z.object({
  shown: z.boolean().default(true),
  items: z
    .array(
      z.object({
        categoryId: z.string().default(""),
        title: z.string().default(""),
        image: z.string().optional(),
        href: z.string().default("/catalog"),
      }),
    )
    .default([]),
})

const AboutSchema = z.object({
  shown: z.boolean().default(true),
  title: z.string().default("About Stick'N'Style"),
  description: z
    .string()
    .default(
      "We help designers and wholesalers create beautiful, functional interiors with premium 3D wall panels, flooring, and adhesive solutions.",
    ),
  image: z.string().optional(),
  features: z
    .array(
      z.object({
        title: z.string().default("Feature"),
        text: z.string().default("Description"),
      }),
    )
    .default([
      { title: "Wholesale‑ready", text: "Box, KG, m³ — all tracked and summarized." },
      { title: "Export to PDF/Excel", text: "Share and archive orders instantly." },
    ]),
})

const FooterCtaSchema = z.object({
  shown: z.boolean().default(true),
  title: z.string().default("Create an order in 1 click"),
  subtitle: z.string().default("Fast and accurate orders for B2B partners"),
  body: z.string().optional(),
  button: z.object({
    label: z.string().default("Create Now"),
    href: z.string().default("/create-n-order"),
  }),
})

export const PageSchema = z.object({
  id: z.string(),
  title: z.string().default("Home"),
  path: z.string().default("/"),
  status: z.enum(["draft", "published"]).default("draft"),
  sections: z.object({
    hero: HeroSchema.default(HeroSchema.parse({})),
    categories: CategoriesSchema.default(CategoriesSchema.parse({})),
    about: AboutSchema.default(AboutSchema.parse({})),
    footerCta: FooterCtaSchema.default(
      FooterCtaSchema.parse({ button: { label: "Create Now", href: "/create-n-order" } }),
    ),
  }),
  updatedAt: z.string(),
})

export type Page = z.infer<typeof PageSchema>

function nowISO() {
  return new Date().toISOString()
}

function makeHome(): Page {
  return PageSchema.parse({
    id: "home",
    title: "Home",
    path: "/",
    sections: {
      hero: HeroSchema.parse({}),
      categories: CategoriesSchema.parse({ items: [] }),
      about: AboutSchema.parse({}),
      footerCta: FooterCtaSchema.parse({
        button: { label: "Create Now", href: "/create-n-order" },
      }),
    },
    updatedAt: nowISO(),
  })
}

// In-memory store
let seeded = false
let pages: Page[] = []

export function seedPages() {
  if (seeded) return
  pages = [makeHome()]
  seeded = true
}

export function listPages(): Page[] {
  seedPages()
  return pages
}

export function getPage(id: string): Page | undefined {
  seedPages()
  return pages.find((p) => p.id === id)
}

export function upsertPage(next: Partial<Page> & { id: string }): Page {
  seedPages()
  const existing = pages.findIndex((p) => p.id === next.id)
  const base = existing >= 0 ? pages[existing] : makeHome()
  const merged = PageSchema.parse({
    ...base,
    ...next,
    sections: {
      ...base.sections,
      ...(next.sections || {}),
      hero: HeroSchema.parse({ ...(base.sections.hero || {}), ...((next.sections as any)?.hero || {}) }),
      categories: CategoriesSchema.parse({
        ...(base.sections.categories || {}),
        ...((next.sections as any)?.categories || {}),
      }),
      about: AboutSchema.parse({ ...(base.sections.about || {}), ...((next.sections as any)?.about || {}) }),
      footerCta: FooterCtaSchema.parse({
        ...(base.sections.footerCta || {}),
        ...((next.sections as any)?.footerCta || {}),
      }),
    },
    updatedAt: nowISO(),
  })
  if (existing >= 0) {
    pages[existing] = merged
  } else {
    pages.push(merged)
  }
  return merged
}

export function deletePage(id: string): boolean {
  seedPages()
  const before = pages.length
  pages = pages.filter((p) => p.id !== id)
  return pages.length < before
}
