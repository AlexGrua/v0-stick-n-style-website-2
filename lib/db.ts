import type { Product, Category, Container, Attribute, Settings, HomePageData } from "./types"
import { generateSku } from "./sku"

type DBShape = {
  seeded: boolean
  products: Product[]
  categories: Category[]
  containers: Container[]
  attributes: Attribute[]
  settings: Settings
  homePage: HomePageData
}

declare global {
  // eslint-disable-next-line no-var
  var __MEMDB__: DBShape | undefined
}

export function db(): DBShape {
  if (!globalThis.__MEMDB__) {
    const now = new Date().toISOString()
    globalThis.__MEMDB__ = {
      seeded: false,
      products: [],
      categories: [],
      containers: [],
      attributes: [],
      settings: {
        companyName: "Stick'N'Style",
        defaultLocale: "en",
        currency: "USD",
        exportColumns: [
          "sku",
          "name",
          "category",
          "sub",
          "sizes",
          "thickness",
          "pcsPerBox",
          "boxKg",
          "boxM3",
          "status",
          "thumbnailUrl",
        ],
        exportLogoUrl: "",
        createdAt: now,
        updatedAt: now,
      },
      homePage: {
        hero: {
          title: "Stick'N'Style",
          subtitle: "Премиальные отделочные материалы",
          description: "Создайте уникальный интерьер с нашими инновационными решениями для стен и полов",
          backgroundImage: "/modern-interior-3d-panels.png",
          ctaText: "Смотреть каталог",
          ctaLink: "/catalog",
          visible: true,
        },
        advantages: {
          title: "Наши преимущества",
          subtitle: "Почему выбирают нас",
          advantages: [
            {
              id: crypto.randomUUID(),
              icon: "🏆",
              title: "Премиальное качество",
              description: "Только лучшие материалы от проверенных производителей",
            },
            {
              id: crypto.randomUUID(),
              icon: "🚚",
              title: "Быстрая доставка",
              description: "Доставляем по всему миру в кратчайшие сроки",
            },
            {
              id: crypto.randomUUID(),
              icon: "💡",
              title: "Инновационные решения",
              description: "Современные технологии для вашего интерьера",
            },
          ],
          visible: true,
        },
        productGallery: {
          title: "Популярные товары",
          subtitle: "Наши бестселлеры",
          products: [
            {
              id: crypto.randomUUID(),
              name: "3D Панели",
              image: "/stone-brick-wall-panels.png",
              category: "wall-panel",
              link: "/catalog/wall-panel",
            },
            {
              id: crypto.randomUUID(),
              name: "Напольные покрытия",
              image: "/wood-flooring-textures.png",
              category: "flooring",
              link: "/catalog/flooring",
            },
          ],
          visible: true,
        },
        cooperation: {
          title: "Сотрудничество",
          subtitle: "Работаем с профессионалами",
          description: "Специальные условия для дизайнеров, архитекторов и строительных компаний",
          backgroundImage: "/fabric-texture-wall-panels.png",
          ctaText: "Стать партнером",
          ctaLink: "/partnership",
          visible: true,
        },
        customBlocks: [],
        updatedAt: now,
      },
    }
  }
  return globalThis.__MEMDB__!
}

export function seed() {
  const state = db()
  if (state.seeded) return

  const now = new Date().toISOString()
  // Seed categories with subs
  const mkCat = (name: string, slug: string, subs: string[]): Category => ({
    id: crypto.randomUUID(),
    name,
    slug,
    subs: subs.map((n) => ({ id: crypto.randomUUID(), name: n })),
    createdAt: now,
    updatedAt: now,
  })
  const wp = mkCat("Wall Panel", "wall-panel", ["Sub 1", "Sub 2", "Sub 3"])
  const fl = mkCat("Flooring", "flooring", ["Sub 1", "Sub 2", "Sub 3"])
  const ad = mkCat("Adhesive", "adhesive", ["Sub 1", "Sub 2"])
  const ac = mkCat("Accessories", "accessories", ["Sub 1", "Sub 2", "Sub 3"])
  state.categories = [wp, fl, ad, ac]

  // Helper to generate default colors
  const defaultColors = () => [
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
  ]

  // Seed a few products
  const make = (partial: Partial<Product>): Product => ({
    id: crypto.randomUUID(),
    sku: partial.sku ?? generateSku((partial.category ?? "wall-panel") as any),
    name: partial.name ?? "Sample",
    description: partial.description,
    technicalDescription: partial.description ?? "High-quality finish suitable for interiors.",
    photos: { main: partial.thumbnailUrl, others: [] },
    infographics: { main: "/abstract-geometric-shapes.png", others: [] },
    colors: (partial.colors as any) ?? (defaultColors() as any),
    category: (partial.category as any) ?? "wall-panel",
    sub: partial.sub ?? "Sub 1",
    thickness: partial.thickness ?? ["2 mm"],
    sizes: partial.sizes ?? ["60×60cm"],
    pcsPerBox: partial.pcsPerBox ?? 50,
    boxKg: partial.boxKg ?? 31,
    boxM3: partial.boxM3 ?? 1.2,
    minOrderBoxes: 1,
    status: (partial.status as any) ?? "active",
    tags: [],
    customFields: {},
    thumbnailUrl: partial.thumbnailUrl,
    gallery: [],
    stockLevel: 0,
    version: 1,
    createdAt: now,
    updatedAt: now,
  })

  state.products = [
    make({ name: "A4", category: "wall-panel", sub: "Sub 1", thumbnailUrl: "/simple-wooden-panel.png" }),
    make({ name: "A5", category: "wall-panel", sub: "Sub 2", thumbnailUrl: "/simple-wooden-panel.png" }),
    make({ name: "Oak Prime", category: "flooring", sub: "Sub 1", thumbnailUrl: "/interior-flooring.png" }),
    make({ name: "Metro Tile", category: "adhesive", sub: "Sub 1", thumbnailUrl: "/decorative-tile.png" }),
  ]

  // Seed containers
  state.containers = [
    {
      id: crypto.randomUUID(),
      name: "20'",
      code: "20",
      capacityKg: 28000,
      capacityM3: 28,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: "40'",
      code: "40",
      capacityKg: 28000,
      capacityM3: 68,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: "40HC",
      code: "40HC",
      capacityKg: 28000,
      capacityM3: 76,
      createdAt: now,
      updatedAt: now,
    },
  ]

  // Seed attributes
  state.attributes = [
    {
      id: crypto.randomUUID(),
      name: "Surface",
      code: "surface",
      type: "select",
      required: false,
      public: true,
      options: ["Matte", "Glossy", "Textured"],
      unit: undefined,
      min: undefined,
      max: undefined,
      step: undefined,
      categoryIds: [wp.id],
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: "Waterproof",
      code: "waterproof",
      type: "boolean",
      required: false,
      public: true,
      options: [],
      unit: undefined,
      min: undefined,
      max: undefined,
      step: undefined,
      categoryIds: [fl.id, ad.id],
      order: 2,
      createdAt: now,
      updatedAt: now,
    },
  ]

  state.seeded = true

  // Данные главной страницы инициализируются только один раз в функции db()
  // и больше не перезаписываются, чтобы сохранить изменения из админ-панели
}
