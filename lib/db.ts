import { supabaseAdmin } from "./supabase/server"
import type { Product, Category, Attribute, Settings, HomePageData } from "./types"
import { generateSku } from "./sku"

type DBShape = {
  seeded: boolean
  products: Product[]
  categories: Category[]
  containers: any[]
  attributes: Attribute[]
  settings: Settings
  homePage: HomePageData
}

export async function getHomePageData(): Promise<HomePageData | null> {
  try {
    const { data, error } = await supabaseAdmin.from("home_page_data").select("*").single()

    if (error) {
      // Если ошибка "PGRST116" - значит данных просто нет, можно создать дефолтные
      if (error.code === "PGRST116") {
        console.log("No home page data found, creating default data for the first time")
        const defaultData = getDefaultHomePageData()
        await saveHomePageData(defaultData)
        return defaultData
      }

      // При других ошибках не перезаписываем данные, возвращаем null
      console.error("Error fetching home page data:", error)
      return null
    }

    if (!data) {
      // Только если данных действительно нет в БД, создаем дефолтные
      console.log("No home page data found, creating default data for the first time")
      const defaultData = getDefaultHomePageData()
      await saveHomePageData(defaultData)
      return defaultData
    }

    return data.data as HomePageData
  } catch (error) {
    console.error("Error in getHomePageData:", error)
    return null
  }
}

export async function saveHomePageData(data: HomePageData): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from("home_page_data").upsert({
      id: 1, // Используем фиксированный ID для единственной записи
      data: data,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error saving home page data:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in saveHomePageData:", error)
    return false
  }
}

function getDefaultHomePageData(): HomePageData {
  const now = new Date().toISOString()
  return {
         hero: {
       title: "Stick'N'Style",
       subtitle: "Премиальные отделочные материалы",
       description: "Создайте уникальный интерьер с нашими инновационными решениями для стен и полов",
       backgroundImage: "/modern-interior-3d-panels.png",
       ctaText: "Смотреть каталог",
       ctaLink: "/catalog",
       buttons: [],
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
       features: [],
       buttons: [],
       visible: true,
     },
    customBlocks: [],
    updatedAt: now,
  }
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
      homePage: getDefaultHomePageData(),
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
     technicalSpecifications: [],
     colorVariants: [],
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

export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabaseAdmin.from("products").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching products:", error)
      return []
    }

         // Преобразуем данные из Supabase в формат Product
     return (data || []).map((row: any) => ({
       id: row.id,
       sku: row.sku,
       name: row.name,
       description: row.description,
       technicalDescription: row.technical_description,
       photos: row.photos || { main: row.thumbnail_url, others: [] },
       infographics: row.infographics || { main: "/abstract-geometric-shapes.png", others: [] },
       colors: row.colors || [],
       category: row.category,
       sub: row.sub,
       thickness: row.thickness || [],
       sizes: row.sizes || [],
       pcsPerBox: row.pcs_per_box || 0,
       boxKg: row.box_kg || 0,
       boxM3: row.box_m3 || 0,
       minOrderBoxes: row.min_order_boxes || 1,
       status: row.status,
       tags: row.tags || [],
       customFields: row.custom_fields || {},
       thumbnailUrl: row.thumbnail_url,
       gallery: row.gallery || [],
       stockLevel: row.stock_level || 0,
       version: row.version || 1,
       technicalSpecifications: [],
       colorVariants: [],
       createdAt: row.created_at,
       updatedAt: row.updated_at,
     }))
  } catch (error) {
    console.error("Error in getProducts:", error)
    return []
  }
}

export async function saveProduct(product: Partial<Product>): Promise<Product | null> {
  try {
    const productData = {
      sku: product.sku,
      name: product.name,
      description: product.description,
      technical_description: product.technicalDescription,
      photos: product.photos,
      infographics: product.infographics,
      colors: product.colors,
      category: product.category,
      sub: product.sub,
      thickness: product.thickness,
      sizes: product.sizes,
      pcs_per_box: product.pcsPerBox,
      box_kg: product.boxKg,
      box_m3: product.boxM3,
      min_order_boxes: product.minOrderBoxes,
      status: product.status,
      tags: product.tags,
      custom_fields: product.customFields,
      thumbnail_url: product.thumbnailUrl,
      gallery: product.gallery,
      stock_level: product.stockLevel,
      version: product.version,
      updated_at: new Date().toISOString(),
    }

    let result
    if (product.id) {
      // Обновление существующего продукта
      result = await supabaseAdmin.from("products").update(productData).eq("id", product.id).select().single()
    } else {
      // Создание нового продукта
      result = await supabaseAdmin.from("products").insert(productData).select().single()
    }

    if (result.error) {
      console.error("Error saving product:", result.error)
      return null
    }

    // Преобразуем обратно в формат Product
    const row = result.data
         return {
       id: row.id,
       sku: row.sku,
       name: row.name,
       description: row.description,
       technicalDescription: row.technical_description,
       photos: row.photos || { main: row.thumbnail_url, others: [] },
       infographics: row.infographics || { main: "/abstract-geometric-shapes.png", others: [] },
       colors: row.colors || [],
       category: row.category,
       sub: row.sub,
       thickness: row.thickness || [],
       sizes: row.sizes || [],
       pcsPerBox: row.pcs_per_box || 0,
       boxKg: row.box_kg || 0,
       boxM3: row.box_m3 || 0,
       minOrderBoxes: row.min_order_boxes || 1,
       status: row.status,
       tags: row.tags || [],
       customFields: row.custom_fields || {},
       thumbnailUrl: row.thumbnail_url,
       gallery: row.gallery || [],
       stockLevel: row.stock_level || 0,
       version: row.version || 1,
       technicalSpecifications: [],
       colorVariants: [],
       createdAt: row.created_at,
       updatedAt: row.updated_at,
     }
  } catch (error) {
    console.error("Error in saveProduct:", error)
    return null
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabaseAdmin.from("categories").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }

         return (data || []).map((row: any) => ({
       id: row.id,
       name: row.name,
       slug: row.slug,
       subs: row.subs || [],
       createdAt: row.created_at,
       updatedAt: row.updated_at,
     }))
  } catch (error) {
    console.error("Error in getCategories:", error)
    return []
  }
}

export async function saveCategory(category: Partial<Category>): Promise<Category | null> {
  try {
    const categoryData = {
      name: category.name,
      slug: category.slug,
      // Убираем subs - они управляются триггерами
      updated_at: new Date().toISOString(),
    }

    let result
    if (category.id) {
      // Обновление существующей категории
      result = await supabaseAdmin.from("categories").update(categoryData).eq("id", category.id).select().single()
    } else {
      // Создание новой категории
      result = await supabaseAdmin.from("categories").insert(categoryData).select().single()
    }

    if (result.error) {
      console.error("Error saving category:", result.error)
      return null
    }

    return {
      id: result.data.id,
      name: result.data.name,
      slug: result.data.slug,
      status: result.data.status, // Добавляем статус
      subs: result.data.subs || [],
      createdAt: result.data.created_at,
      updatedAt: result.data.updated_at,
    }
  } catch (error) {
    console.error("Error in saveCategory:", error)
    return null
  }
}

export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const { data, error } = await supabaseAdmin.from("categories").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching category by id:", error)
      return null
    }

    if (!data) return null

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      status: data.status, // Добавляем статус
      subs: data.subs || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (error) {
    console.error("Error in getCategoryById:", error)
    return null
  }
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
  try {
    const categoryData = {
      name: updates.name,
      slug: updates.slug,
      status: updates.status, // Добавляем поддержку статуса
      // Убираем subs - они управляются триггерами
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin.from("categories").update(categoryData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating category:", error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      status: data.status, // Добавляем статус в возвращаемые данные
      subs: data.subs || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (error) {
    console.error("Error in updateCategory:", error)
    return null
  }
}

export async function deleteCategory(id: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", id)

    if (error) {
      console.error("Error deleting category:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteCategory:", error)
    return false
  }
}
