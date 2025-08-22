"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Product, Category } from "@/lib/types"
import { ProductDetailView } from "@/components/catalog/product-detail-view"
import { SiteFooter } from "@/components/site-footer"
import { cn } from "@/lib/utils"

async function getProduct(id: string): Promise<Product | null> {
  try {
    console.log("[v0] Fetching product with ID:", id)

    const url = `/api/products/${id}`
    console.log("[v0] API URL:", url)

    const response = await fetch(url, {
      cache: "no-store",
    })

    console.log("[v0] Response status:", response.status)
    console.log("[v0] Response ok:", response.ok)

    if (!response.ok) {
      console.log("[v0] Response not ok, returning null")
      return null
    }

    const product = await response.json()
    console.log("[v0] Product fetched successfully:", product?.name)
    return product
  } catch (error) {
    console.error("[v0] Error fetching product:", error)
    return null
  }
}

function CatalogFilters() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [search, setSearch] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState<string>("all")
  const [activeSubcategory, setActiveSubcategory] = React.useState<string>("all")
  const [searchResults, setSearchResults] = React.useState<Product[]>([])
  const [showResults, setShowResults] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/categories")
      .then(async (res) => {
        const data = await res.json()
        setCategories(data.items || [])
      })
      .catch(() => {})
  }, [])

  const activeSubcategories = React.useMemo(() => {
    if (activeCategory === "all") return []
    const category = categories.find((c) => c.slug === activeCategory)
    return category?.subs || []
  }, [categories, activeCategory])

  function handleCategoryChange(categorySlug: string) {
    setActiveCategory(categorySlug)
    setActiveSubcategory("all")
    // Navigate to catalog with filters
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (categorySlug !== "all") params.set("category", categorySlug)
    window.location.href = `/catalog?${params.toString()}`
  }

  function handleSubcategoryChange(subcategoryName: string) {
    setActiveSubcategory(subcategoryName)
    // Navigate to catalog with filters
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (activeCategory !== "all") params.set("category", activeCategory)
    if (subcategoryName !== "all") params.set("subcategory", subcategoryName)
    window.location.href = `/catalog?${params.toString()}`
  }

  async function handleSearch() {
    if (!search.trim()) {
      setShowResults(false)
      setSearchResults([])
      return
    }

    try {
      const params = new URLSearchParams()
      params.set("q", search)
      if (activeCategory !== "all") params.set("category", activeCategory)
      params.set("includeInactive", "true")

      const response = await fetch(`/api/products?${params.toString()}`)
      const data = await response.json()

      setSearchResults(data.items || [])
      setShowResults(true)
    } catch (error) {
      console.error("[v0] Search error:", error)
      setSearchResults([])
      setShowResults(true)
    }
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </Link>

        <div className="max-w-md w-full md:w-auto relative">
          <Input
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pr-10"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showResults && (
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Search Results ({searchResults.length} found)</h3>
            <button onClick={() => setShowResults(false)} className="text-sm text-gray-500 hover:text-gray-700">
              Clear Results
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((product) => (
                <Link
                  key={product.id}
                  href={`/catalog/${product.id}`}
                  className="block p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{product.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No products found matching "{search}"</div>
          )}
        </div>
      )}

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
          All Categories
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
            All
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
    </div>
  )
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = React.useState<Product | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    getProduct(params.id)
      .then(setProduct)
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <main className="container mx-auto px-4 py-8">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Catalog
          </Link>
          <div className="mt-6 text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
            <p className="text-gray-600">The product you're looking for doesn't exist or has been removed.</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Catalog
          </Link>
        </div>

        <ProductDetailView product={product} />
      </main>
      <SiteFooter />
    </div>
  )
}
