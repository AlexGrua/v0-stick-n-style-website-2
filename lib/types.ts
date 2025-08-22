export type CategoryKey = string

export type ProductStatus = "active" | "inactive" | "discontinued"

export type Product = {
  id: string
  sku: string
  name: string
  description?: string
  category: CategoryKey
  sub: string
  thickness: string[] // REQUIRED (min 1)
  sizes: string[] // REQUIRED (min 1)
  pcsPerBox: number
  boxKg: number
  boxM3: number
  minOrderBoxes?: number
  status: ProductStatus // use "inactive" instead of separate hidden flag
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
  colors?: Array<{ nameEn: string; nameRu: string; mainImage: string }>
}

export type Subcategory = { id: string; name: string }

export type Category = {
  id: string
  name: string
  slug: string
  subs: Subcategory[]
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
  showLanguageSwitcher: boolean
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

export type HeroBlockData = {
  title: string
  subtitle: string
  description: string
  backgroundImage: string
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

export type CooperationBlockData = {
  title: string
  subtitle: string
  description: string
  backgroundImage: string
  ctaText: string
  ctaLink: string
  visible: boolean
}

export type CustomBlockData = {
  id: string
  type: "custom"
  title: string
  subtitle: string
  description: string
  backgroundImage: string
  ctaText: string
  ctaLink: string
  visible: boolean
  order: number
}

export type HomePageData = {
  hero: HeroBlockData
  advantages: AdvantagesBlockData
  productGallery: ProductGalleryBlockData
  cooperation: CooperationBlockData
  customBlocks: CustomBlockData[]
  updatedAt: string
}
