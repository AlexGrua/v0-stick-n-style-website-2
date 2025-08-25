export type CategoryKey = string

export type ProductStatus = "active" | "inactive" | "discontinued"

// Technical specifications structure
export type ThicknessSpec = {
  thickness: string
  pcsPerBox: number
  boxSize: string
  boxVolume: number
  boxWeight: number
}

export type TechnicalSpec = {
  size: string
  thicknesses: ThicknessSpec[]
}

export type ColorVariant = {
  name: string
  colorCode: string
  image: string
  priceModifier: number
}

export type ProductSpec = {
  description: string
  icon: string
}

export type InteriorApplication = {
  name: string
  description: string
  image: string
}

export type Product = {
  id: number
  sku: string
  name: string
  description?: string
  category?: string // Changed from CategoryKey to optional string
  sub?: string // Made optional
  subcategory?: string // New field from API
  supplier?: string // New field from API
  categoryId?: number // New field from API
  subcategoryId?: number // New field from API
  supplierId?: string // New field from API
  // Database fields
  slug?: string
  category_id?: number
  image_url?: string
  specifications?: any
  // Legacy fields for backward compatibility (will be deprecated)
  thickness: string[] 
  sizes: string[]
  pcsPerBox: number
  boxKg: number
  boxM3: number
  // New structured fields
  technicalSpecifications: TechnicalSpec[]
  colorVariants: ColorVariant[]
  minOrderBoxes?: number
  status: ProductStatus
  tags: string[]
  customFields?: Record<string, unknown>
  thumbnailUrl?: string
  gallery?: string[]
  stockLevel?: number
  version: number
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
  technicalDescription?: string
  photos?: { main?: string; others?: string[] }
  infographics?: { main?: string; others?: string[] }
  // Legacy colors field for backward compatibility
  colors?: Array<{ nameEn: string; nameRu: string; mainImage: string }>
  // Product specifications
  productSpecifications?: {
    material: ProductSpec[]
    usage: ProductSpec[]
    application: ProductSpec[]
    physicalProperties: ProductSpec[]
    adhesion: ProductSpec[]
  }
  interiorApplications?: InteriorApplication[]
  installationNotes?: string
}

export type Subcategory = { id: number; name: string }

export type Category = {
  id: number
  name: string
  slug: string
  status?: "active" | "inactive"
  subcategories: Subcategory[]
  createdAt: string
  updatedAt: string
}

export type AttributeType = "text" | "number" | "boolean" | "select" | "multiselect" | "color"

export type Attribute = {
  id: string
  name: string
  code: string // slug-like, unique
  type: AttributeType
  required: boolean
  public: boolean
  unit?: string
  min?: number
  max?: number
  step?: number
  options?: string[] // for select/multiselect
  categoryIds: string[] // Categories this attribute applies to
  order?: number
  createdAt: string
  updatedAt: string
}

export type Settings = {
  companyName: string
  defaultLocale: string
  currency: string
  exportColumns: string[] // which columns to include in product CSV/PDF
  exportLogoUrl?: string
  createdAt: string
  updatedAt: string
}

/**
 * Admin-managed CMS Page
 */
export type Page = {
  id: string
  title: string
  path: string // e.g. "/", "/about", "/contact", "/promo/spring"
  visible: boolean
  order?: number
  content?: string // markdown/plain text for now
  seoTitle?: string
  seoDescription?: string
  createdAt: string
  updatedAt: string
}

// Suppliers (admin Supply section)
export type SupplierStatus = "approved" | "pending" | "blocked"

export type Supplier = {
  id: string
  shortName: string
  companyName: string
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  messenger?: string
  country?: string
  currency?: string
  incoterm?: string
  leadTimeDays?: number
  moq?: number
  status: SupplierStatus
  website?: string
  notes?: string
  categories: string[]
  createdAt: string
  updatedAt: string
}

export type HeroButton = {
  id: string
  text: string
  link: string
  variant?: "primary" | "secondary"
}

export type HeroImage = {
  id: string
  url: string
  alt: string
}

export type HeroBlockData = {
  title: string
  subtitle: string
  description: string
  backgroundImage: string
  images?: string[] // упрощенный массив URL изображений для слайдера
  buttons: HeroButton[]
  ctaText: string
  ctaLink: string
  visible: boolean
}

export type AdvantageItem = {
  id: string
  icon: string
  title: string
  description: string
}

export type AdvantagesBlockData = {
  title: string
  subtitle: string
  advantages: AdvantageItem[]
  visible: boolean
}

export type ProductGalleryItem = {
  id: string
  name: string
  image: string
  category: string
  link: string
}

export type ProductGalleryBlockData = {
  title: string
  subtitle: string
  products: ProductGalleryItem[]
  visible: boolean
}

export type CooperationFeature = {
  id: string
  icon: string
  title: string
  description: string
}

export type CooperationButton = {
  id: string
  text: string
  link: string
  variant?: "primary" | "secondary"
}

export type CooperationOffer = {
  id: string
  text: string
}

export type CooperationStat = {
  id: string
  number: string
  label: string
}

export type CooperationBlockData = {
  title: string
  subtitle: string
  description: string
  backgroundImage: string
  uploadedImage?: string // добавлено поле для загруженного изображения
  features: CooperationFeature[] // динамические преимущества сотрудничества
  buttons: CooperationButton[] // динамические кнопки
  offers?: CooperationOffer[] // добавлены динамические предложения партнерам
  stats?: CooperationStat[] // добавлена динамическая статистика
  ctaText: string
  ctaLink: string
  visible: boolean
}

export type CustomBlockData = {
  id: string
  type: "custom"
  title: string
  subtitle?: string // сделано опциональным
  description?: string // сделано опциональным
  backgroundImage?: string // сделано опциональным
  images?: string[] // добавлен массив изображений
  buttons?: CooperationButton[] // добавлены кнопки
  features?: CooperationFeature[] // добавлены преимущества
  ctaText?: string // сделано опциональным
  ctaLink?: string // сделано опциональным
  visible: boolean
  order: number
}

export type HomePageData = {
  hero: HeroBlockData
  advantages: AdvantagesBlockData
  productGallery: ProductGalleryBlockData
  cooperation: CooperationBlockData
  customBlocks: CustomBlockData[]
  blockOrder?: string[] // добавлено поле для порядка блоков
  updatedAt: string
}

export type CatalogLayoutSettings = {
  productsPerRow: number // 2, 3, 4, 5
  cardSize: "small" | "medium" | "large"
  showFilters: boolean
  showSearch: boolean
  showCategories: boolean
  showLeftPanel: boolean
}

export type CatalogFilterSettings = {
  enableCategoryFilter: boolean
  enableSubcategoryFilter: boolean
  enableSearch: boolean
  enableSorting: boolean
  sortOptions: string[] // ["name", "newest", "popular"]
}

export type CatalogContentBlock = {
  id: string
  type: "hero" | "banner" | "text" | "image" | "cta"
  title?: string
  subtitle?: string
  description?: string
  image?: string
  link?: string
  buttonText?: string
  position: "before_products" | "after_products"
  visible: boolean
  order: number
}

export type CatalogPageData = {
  // Basic Settings
  title: string
  description: string
  seoTitle: string
  seoDescription: string

  // Hero Section
  heroTitle: string
  heroSubtitle: string
  heroImage?: string
  showHero: boolean

  // Layout Settings
  layout: CatalogLayoutSettings

  // Filter Settings
  filters: CatalogFilterSettings

  // Content Blocks
  contentBlocks: CatalogContentBlock[]

  // Featured Categories
  featuredCategories: string[]

  // Display Settings
  showProductCount: boolean
  showPagination: boolean
  productsPerPage: number
}
