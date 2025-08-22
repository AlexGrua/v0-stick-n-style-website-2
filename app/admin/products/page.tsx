"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { Product } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Pencil } from "lucide-react"
import { ExtendedProductForm } from "@/components/admin/product-form-extended"
import { redirect } from "next/navigation"

type ProductsResponse = { items: Product[] }

async function fetchProducts(): Promise<ProductsResponse> {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("Failed to load products")
  return (await res.json()) as ProductsResponse
}

export default function ProductsPage() {
  // Redirect all visits of /admin/products to /admin/catalog
  redirect("/admin/catalog")

  const { data, refetch, isLoading, isError } = useQuery({ queryKey: ["products"], queryFn: fetchProducts })
  const products = data?.items ?? []

  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Product | null>(null)

  const openNew = () => {
    setSelected(null)
    setOpen(true)
  }
  const openEdit = (p: Product) => {
    setSelected(p)
    setOpen(true)
  }

  return (
    <main className="p-4 xl:px-[50px]">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading...</div>
          ) : isError ? (
            <div className="p-4 text-sm text-red-600">Failed to load products.</div>
          ) : products.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No products yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="text-left text-sm">
                  <tr className="[&>th]:px-4 [&>th]:py-2">
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Category/Sub</th>
                    <th>Status</th>
                    <th className="w-12 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {products.map((p) => (
                    <tr key={p.id} className="border-t [&>td]:px-4 [&>td]:py-2">
                      <td className="font-medium">{p.name}</td>
                      <td className="text-muted-foreground">{p.sku}</td>
                      <td className="text-muted-foreground">
                        {p.category} / {p.sub}
                      </td>
                      <td className="capitalize">{p.status || "inactive"}</td>
                      <td className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(p)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shared modal for New and Edit (same component) */}
      <ExtendedProductForm
        key={selected?.id || "new"}
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) {
            // ensure next open starts with fresh state
            setTimeout(() => {
              setSelected(null)
              refetch()
            }, 0)
          }
        }}
        product={selected}
      />
    </main>
  )
}
