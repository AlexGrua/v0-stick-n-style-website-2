"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Package, X } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Category, Product } from "@/lib/types"
import { ExtendedProductForm } from "@/components/admin/product-form-extended"
import { DataTable } from "@/components/admin/products-table"
import { useToast } from "@/hooks/use-toast"
import { QuickView } from "@/components/catalog/quick-view"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

async function fetchCategories() {
  const res = await fetch("/api/categories")
  if (!res.ok) throw new Error("Failed to load categories")
  return (await res.json()) as { items: Category[] }
}

async function fetchProducts(params: { search: string; category: string | null; sub: string | null }) {
  const q = new URLSearchParams()
  q.set("limit", "500")
  q.set("sort", "updatedAt")
  q.set("order", "desc")
  if (params.search) q.set("search", params.search)
  if (params.category) q.set("category", params.category)
  if (params.sub) q.set("sub", params.sub)
  const res = await fetch(`/api/products?${q.toString()}`)
  if (!res.ok) throw new Error("Failed to load products")
  return (await res.json()) as { items: Product[]; total: number }
}

export default function CatalogAdminPage() {
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: catData } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories })
  const cats = catData?.items ?? []

  const [productSearch, setProductSearch] = React.useState("")
  const [catFilter, setCatFilter] = React.useState<string | null>(null)
  const [subFilter, setSubFilter] = React.useState<string | null>(null)

  const subsForCat = React.useMemo(() => {
    if (!catFilter) return []
    const found = cats.find((c) => c.slug === catFilter)
    return found?.subs ?? []
  }, [catFilter, cats])

  const { data: prodData, isLoading: prodLoading } = useQuery({
    queryKey: ["products-catalog", { productSearch, catFilter, subFilter }],
    queryFn: () => fetchProducts({ search: productSearch, category: catFilter, sub: subFilter }),
  })
  const items = prodData?.items ?? []

  const { mutate: deleteProduct } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products-catalog"] })
      toast({ title: "Product deleted" })
    },
  })

  const { mutate: toggleStatus } = useMutation({
    mutationFn: async (p: Product) => {
      const next = p.status === "inactive" || p.status === "discontinued" ? "active" : "inactive"
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      return await res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products-catalog"] })
      toast({ title: "Status updated" })
    },
  })

  const { mutate: markDiscontinued } = useMutation({
    mutationFn: async (p: Product) => {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "discontinued" }),
      })
      if (!res.ok) throw new Error("Failed to mark discontinued")
      return await res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products-catalog"] })
      toast({ title: "Marked discontinued" })
    },
  })

  const [openProduct, setOpenProduct] = React.useState(false)
  const [editProduct, setEditProduct] = React.useState<Product | null>(null)
  const [duplicateFrom, setDuplicateFrom] = React.useState<Product | null>(null)

  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [previewProduct, setPreviewProduct] = React.useState<Product | null>(null)

  function handlePreview(p: Product) {
    setPreviewProduct(p)
    setPreviewOpen(true)
  }

  const prevOpenRef = React.useRef(openProduct)
  React.useEffect(() => {
    if (prevOpenRef.current && !openProduct) {
      qc.invalidateQueries({ queryKey: ["products-catalog"] })
      setDuplicateFrom(null)
    }
    prevOpenRef.current = openProduct
  }, [openProduct, qc])

  React.useEffect(() => {
    const onChanged = () => qc.invalidateQueries({ queryKey: ["products-catalog"] })
    window.addEventListener("products:changed", onChanged as EventListener)
    return () => window.removeEventListener("products:changed", onChanged as EventListener)
  }, [qc])

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Products</h1>

      <Tabs defaultValue="products">
        <TabsList className="flex">
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:items-end">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search by name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full"
                />
                {productSearch ? (
                  <Button variant="ghost" size="icon" onClick={() => setProductSearch("")} aria-label="Clear search">
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={catFilter ?? "all"}
                  onValueChange={(v) => {
                    setCatFilter(v === "all" ? null : v)
                    setSubFilter(null)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {cats.map((c) => (
                      <SelectItem key={c.id} value={c.slug}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {catFilter ? (
                  <Button variant="ghost" size="icon" onClick={() => setCatFilter(null)} aria-label="Clear category">
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={subFilter ?? "all"}
                  onValueChange={(v) => setSubFilter(v === "all" ? null : v)}
                  disabled={!catFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subs</SelectItem>
                    {subsForCat.map((s) => (
                      <SelectItem key={s.id || s.name} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {subFilter ? (
                  <Button variant="ghost" size="icon" onClick={() => setSubFilter(null)} aria-label="Clear sub">
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setDuplicateFrom(null)
                  setEditProduct(null)
                  setOpenProduct(true)
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                New Product
              </Button>
            </div>
          </div>

          <DataTable
            data={items}
            total={items.length}
            loading={prodLoading}
            onEdit={(p) => {
              setDuplicateFrom(null)
              setEditProduct(p)
              setOpenProduct(true)
            }}
            onDelete={(p) => deleteProduct(p.id)}
            onToggleStatus={(p) => toggleStatus(p)}
            onMarkDiscontinued={(p) => markDiscontinued(p)}
            onPreview={handlePreview}
            onDuplicate={(p) => {
              setEditProduct(null)
              setDuplicateFrom(p)
              setOpenProduct(true)
            }}
          />

          <ExtendedProductForm
            open={openProduct}
            onOpenChange={setOpenProduct}
            product={editProduct}
            prefillFrom={duplicateFrom || undefined}
          />
          <QuickView open={previewOpen} onOpenChange={setPreviewOpen} product={previewProduct} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
