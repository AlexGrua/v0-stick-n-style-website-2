"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { QuickView } from "@/components/catalog/quick-view"
import { SiteFooter } from "@/components/site-footer"
import type { Category, Product, CatalogPageData, CatalogContentBlock } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Search, ShoppingCart } from "lucide-react"
import { useT } from "@/lib/i18n"
import { useContentTranslations } from "@/lib/content-i18n"

const defaultPageData: CatalogPageData = {
  title: "Catalog",
  description: "Browse our complete collection of premium panels and flooring",
  seoTitle: "Product Catalog - Stick'N'Style",
  seoDescription: "Explore our extensive catalog of 3D wall panels, flooring solutions, and adhesive products",
  heroTitle: "Premium Panels & Flooring Collection",
  heroSubtitle: "Discover innovative solutions for modern interiors",
  showHero: false,
  layout: {
    productsPerRow: 5,
    cardSize: "medium",
    showFilters: true,
    showSearch: true,
    showCategories: true,
    showLeftPanel: false, // No left panel in new design
  },
  filters: {
    enableCategoryFilter: true,
    enableSubcategoryFilter: true,
    enableSearch: true,
    enableSorting: false,
    sortOptions: ["name", "newest"],
  },
  contentBlocks: [],
  featuredCategories: [],
  showProductCount: false,
  showPagination: true,
  productsPerPage: 30, // 5x6 = 30 products per page
  rowsPerPage: 6, // New field for rows per page
}

function ContentBlock({ block }: { block: CatalogContentBlock }) {
  if (!block.visible) return null

  switch (block.type) {
    case "hero":
      return (
        <section className="bg-gradient-to-r from-slate-50 to-slate-100 py-12 mb-8">
          <div className="container mx-auto px-4 text-center">
            {block.image && (
              <div className="relative h-64 w-full mb-6 rounded-lg overflow-hidden">
                <Image src={block.image || "/placeholder.svg"} alt={block.title || ""} fill className="object-cover" />
              </div>
            )}
            {block.title && <h1 className="text-4xl font-bold text-slate-900 mb-4">{block.title}</h1>}
            {block.subtitle && <p className="text-xl text-slate-600 max-w-2xl mx-auto">{block.subtitle}</p>}
          </div>
        </section>
      )
    case "banner":
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
          {block.title && <h3 className="text-lg font-semibold text-orange-900 mb-2">{block.title}</h3>}
          {block.description && <p className="text-orange-800">{block.description}</p>}
          {block.link && block.buttonText && (
            <Link href={block.link} className="inline-block mt-4">
              <Button className="bg-orange-600 hover:bg-orange-700">{block.buttonText}</Button>
            </Link>
          )}
        </div>
      )
    case "text":
      return (
        <div className="prose max-w-none mb-6">
          {block.title && <h3>{block.title}</h3>}
          {block.description && <p>{block.description}</p>}
        </div>
      )
    default:
      return null
  }
}

function TranslatedProductName({ id, fallback }: { id: string; fallback: string }) {
  const { dict } = useContentTranslations("product", id)
  return <>{dict.name || fallback}</>
}

export default function CatalogPage() {
  const t = useT()
  const [categories, setCategories] = React.useState<Category[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [pageData, setPageData] = React.useState<CatalogPageData>(defaultPageData)
  const [quickView, setQuickView] = React.useState<Product | null>(null)

  const [search, setSearch] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState<string>("all")
  const [activeSubcategory, setActiveSubcategory] = React.useState<string>("all")
  const [currentPage, setCurrentPage] = React.useState(1)

  React.useEffect(() => {
    Promise.all([fetch("/api/categories"), fetch("/api/products?limit=10000"), fetch("/api/pages/catalog")])
      .then(async ([c, p, pageRes]) => {
        const [categoriesData, productsData] = await Promise.all([c.json(), p.json()])

        if (pageRes.ok) {
          const pageResult = await pageRes.json()
          if (pageResult.content) {
            const parsed = JSON.parse(pageResult.content)
            setPageData((prev) => ({ ...prev, ...parsed }))
          }
        }

        setCategories(categoriesData.items || [])
        setProducts(productsData.items || [])
      })
      .catch(() => {})
  }, [])

  const activeSubcategories = React.useMemo(() => {
    if (activeCategory === "all") return []
    const category = categories.find((c) => c.slug === activeCategory)
    return category?.subcategories || []
  }, [categories, activeCategory])

  const filteredProducts = React.useMemo(() => {
    const filtered = products.filter((p) => {
      const matchesSearch = search === "" || p.name.toLowerCase().includes(search.toLowerCase())

      let matchesCategory = true
      if (activeCategory !== "all") {
        const selectedCategory = categories.find((c) => c.slug === activeCategory)
        if (selectedCategory) {
          matchesCategory = p.category_id === selectedCategory.id
        } else {
          matchesCategory = false
        }
      }

      let matchesSubcategory = true
      if (activeSubcategory !== "all" && activeCategory !== "all") {
        const selectedCategory = categories.find((c) => c.slug === activeCategory)
        if (selectedCategory && selectedCategory.subcategories) {
          const selectedSub = selectedCategory.subcategories.find((sub: any) => sub.name === activeSubcategory)
          if (selectedSub) {
            matchesSubcategory = p.subcategory_id === selectedSub.id || p.sub === activeSubcategory
          } else {
            matchesSubcategory = false
          }
        }
      }

      return matchesSearch && matchesCategory && matchesSubcategory
    })

    return filtered
  }, [products, search, activeCategory, activeSubcategory, categories])

  const totalPages = Math.ceil(filteredProducts.length / pageData.productsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageData.productsPerPage,
    currentPage * pageData.productsPerPage,
  )

  function handleCategoryChange(categorySlug: string) {
    setActiveCategory(categorySlug)
    setActiveSubcategory("all")
    setCurrentPage(1)
  }

  function handleSubcategoryChange(subcategoryName: string) {
    setActiveSubcategory(subcategoryName)
    setCurrentPage(1)
  }

  function handleSearch() {
    setCurrentPage(1)
  }

  const beforeProductsBlocks = pageData.contentBlocks
    .filter((block) => block.position === "before_products")
    .sort((a, b) => a.order - b.order)

  const afterProductsBlocks = pageData.contentBlocks
    .filter((block) => block.position === "after_products")
    .sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto max-w-7xl px-4 py-8">
        {beforeProductsBlocks.map((block) => (
          <ContentBlock key={block.id} block={block} />
        ))}

        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Category tabs centered independently */}
            <div className="flex-1 flex justify-center">
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => handleCategoryChange("all")}
                  className={cn(
                    "min-w-[120px] px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                    activeCategory === "all"
                      ? "bg-lime-500 text-white border-lime-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                  )}
                >
                  {t('catalog.all_categories','All Categories')}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.slug)}
                    className={cn(
                      "min-w-[120px] px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                      activeCategory === category.slug
                        ? "bg-lime-500 text-white border-lime-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Search positioned to the right */}
            <div className="max-w-md w-full lg:w-auto relative">
              <Input
                placeholder={t('catalog.search_placeholder','Search products by name or SKU...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pr-10"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={t('catalog.search','Search')}
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {activeCategory !== "all" && activeSubcategories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleSubcategoryChange("all")}
                className={cn(
                  "min-w-[80px] px-3 py-1.5 rounded border text-xs font-medium transition-colors",
                  activeSubcategory === "all"
                    ? "bg-lime-500 text-white border-lime-500"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
                )}
              >
                {t('catalog.all','All')}
              </button>
              {activeSubcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSubcategoryChange(sub.name)}
                  className={cn(
                    "min-w-[80px] px-3 py-1.5 rounded border text-xs font-medium transition-colors",
                    activeSubcategory === sub.name
                      ? "bg-lime-500 text-white border-lime-500"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
                  )}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}

          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-lg border overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow relative"
              >
                <Link href={`/catalog/${product.id}`} className="block">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={product.thumbnailUrl || "/placeholder.svg?height=300&width=400&query=product%20image"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>
                <div className="p-3 pb-12">
                  <Link href={`/catalog/${product.id}`} className="block mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      <TranslatedProductName id={product.id as string} fallback={product.name} />
                      {product.sku && ` • ${product.sku}`}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {product.category} • {product.sub}
                    </p>
                  </Link>
                </div>
              </div>
            ))}
          </section>

          {pageData.showPagination && (
            <div className="flex justify-center mt-8">
              <nav aria-label="Pagination">
                <ul className="inline-flex items-center -space-x-px">
                  <li>
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="rounded-l-lg"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <li key={i + 1}>
                      <Button
                        onClick={() => setCurrentPage(i + 1)}
                        className={cn(
                          "px-3 py-2 leading-tight text-gray-500 border border-gray-300 hover:bg-gray-100 hover:text-gray-700",
                          currentPage === i + 1
                            ? "z-10 bg-lime-500 text-white border-lime-500"
                            : "",
                        )}
                      >
                        {i + 1}
                      </Button>
                    </li>
                  ))}
                  <li>
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-r-lg"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>

        {afterProductsBlocks.map((block) => (
          <ContentBlock key={block.id} block={block} />
        ))}
      </main>
      <SiteFooter />
      <QuickView open={!!quickView} onOpenChange={(v) => !v && setQuickView(null)} product={quickView} />
    </div>
  )
}
