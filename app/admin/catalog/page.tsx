"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Package, X, Download, Upload } from "lucide-react"
import type { Category, Product } from "@/lib/types"
import { ProductFormNew } from "@/components/admin/product-form-new"
import { ProductsTableNew } from "@/components/admin/products-table-new"
import { CSVImportDialog } from "@/components/admin/csv-import-dialog"
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
  q.set("includeInactive", "true")
  if (params.search) q.set("search", params.search)
  if (params.category) q.set("category", params.category)
  if (params.sub) q.set("sub", params.sub)
  const res = await fetch(`/api/products?${q.toString()}`)
  if (!res.ok) throw new Error("Failed to load products")
  return (await res.json()) as { items: Product[]; total: number }
}

export default function CatalogAdminPage() {
  const { toast } = useToast()

  const [cats, setCats] = React.useState<Category[]>([])
  const [items, setItems] = React.useState<Product[]>([])
  const [prodLoading, setProdLoading] = React.useState(false)

  const [productSearch, setProductSearch] = React.useState("")
  const [catFilter, setCatFilter] = React.useState<string | null>(null)
  const [subFilter, setSubFilter] = React.useState<string | null>(null)

  const subsForCat = React.useMemo(() => {
    if (!catFilter) return []
    const found = cats.find((c) => c.slug === catFilter)
    return found?.subs ?? []
  }, [catFilter, cats])

  React.useEffect(() => {
    fetchCategories()
      .then((data) => setCats(data.items))
      .catch((error) => console.error("Failed to load categories:", error))
  }, [])

  React.useEffect(() => {
    setProdLoading(true)
    fetchProducts({ search: productSearch, category: catFilter, sub: subFilter })
      .then((data) => {
        setItems(data.items)
        console.log("[v0] Loaded products:", data.items.length)
      })
      .catch((error) => console.error("Failed to load products:", error))
      .finally(() => setProdLoading(false))
  }, [productSearch, catFilter, subFilter])

  const deleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      // Reload products
      const data = await fetchProducts({ search: productSearch, category: catFilter, sub: subFilter })
      setItems(data.items)
      toast({ title: "Product deleted" })
    } catch (error) {
      console.error("Delete failed:", error)
    }
  }

  const toggleStatus = async (p: Product) => {
    try {
      const next = p.status === "inactive" || p.status === "discontinued" ? "active" : "inactive"
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      // Reload products
      const data = await fetchProducts({ search: productSearch, category: catFilter, sub: subFilter })
      setItems(data.items)
      toast({ title: "Status updated" })
    } catch (error) {
      console.error("Status update failed:", error)
    }
  }

  const markDiscontinued = async (p: Product) => {
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "discontinued" }),
      })
      if (!res.ok) throw new Error("Failed to mark discontinued")
      // Reload products
      const data = await fetchProducts({ search: productSearch, category: catFilter, sub: subFilter })
      setItems(data.items)
      toast({ title: "Marked discontinued" })
    } catch (error) {
      console.error("Mark discontinued failed:", error)
    }
  }

  const [openProduct, setOpenProduct] = React.useState(false)
  const [editProduct, setEditProduct] = React.useState<Product | null>(null)
  const [duplicateFrom, setDuplicateFrom] = React.useState<Product | null>(null)

  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [previewProduct, setPreviewProduct] = React.useState<Product | null>(null)
  const [importOpen, setImportOpen] = React.useState(false)

  function handlePreview(p: Product) {
    setPreviewProduct(p)
    setPreviewOpen(true)
  }

  const prevOpenRef = React.useRef(openProduct)
  React.useEffect(() => {
    if (prevOpenRef.current && !openProduct) {
      // Reload products when form closes
      fetchProducts({ search: productSearch, category: catFilter, sub: subFilter })
        .then((data) => setItems(data.items))
        .catch((error) => console.error("Failed to reload products:", error))
      setDuplicateFrom(null)
    }
    prevOpenRef.current = openProduct
  }, [openProduct, productSearch, catFilter, subFilter])

  React.useEffect(() => {
    const onChanged = () => {
      // Reload products when products change
      fetchProducts({ search: productSearch, category: catFilter, sub: subFilter })
        .then((data) => setItems(data.items))
        .catch((error) => console.error("Failed to reload products:", error))
    }
    window.addEventListener("products:changed", onChanged as EventListener)
    return () => window.removeEventListener("products:changed", onChanged as EventListener)
  }, [productSearch, catFilter, subFilter])

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

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/products/export')
                    if (!response.ok) throw new Error('Export failed')
                    
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'products-export.csv'
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                    
                    toast({ title: "Export successful", description: "Products exported to CSV" })
                  } catch (error) {
                    console.error('Export failed:', error)
                    toast({ title: "Export failed", description: "Failed to export products", variant: "destructive" })
                  }
                }}
              >
                <Download className="mr-1 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="mr-1 h-4 w-4" />
                Import CSV
              </Button>
              <Button
                onClick={() => {
                  console.log("[v0] New Product button clicked")
                  console.log("[v0] Current openProduct state:", openProduct)
                  setDuplicateFrom(null)
                  setEditProduct(null)
                  setOpenProduct(true)
                  console.log("[v0] Set openProduct to true")
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                New Product
              </Button>
            </div>
          </div>

          <ProductsTableNew
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

          <ProductFormNew
            open={openProduct}
            onOpenChange={setOpenProduct}
            product={editProduct}
            prefillFrom={duplicateFrom || undefined}
          />
          <QuickView open={previewOpen} onOpenChange={setPreviewOpen} product={previewProduct} />
          <CSVImportDialog 
            open={importOpen} 
            onOpenChange={setImportOpen}
            onImportComplete={() => {
              // Reload products after import
              fetchProducts({ search: productSearch, category: catFilter, sub: subFilter })
                .then((data) => setItems(data.items))
                .catch((error) => console.error("Failed to reload products:", error))
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
