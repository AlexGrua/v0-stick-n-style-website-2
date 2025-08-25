"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Copy, Trash2, Search, Eye } from "lucide-react"
import type { Product } from "@/lib/types"

interface ProductsTableNewProps {
  data: Product[]
  total: number
  loading: boolean
  onEdit: (product: Product) => void
  onDuplicate: (product: Product) => void
  onDelete: (product: Product) => void
  onToggleStatus: (product: Product) => void
  onMarkDiscontinued: (product: Product) => void
  onPreview: (product: Product) => void
}

export function ProductsTableNew({
  data,
  total,
  loading,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleStatus,
  onMarkDiscontinued,
  onPreview,
}: ProductsTableNewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof Product>("updatedAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const safeProducts = data || []

  console.log("[v0] ProductsTableNew rendered with:", {
    productsCount: safeProducts.length,
    total: total,
    loading: loading,
    data: data,
    safeProducts: safeProducts,
  })

  const getCategoryName = (category: string) => {
    return category || "Unknown"
  }

  const getSubcategoryName = (sub: string) => {
    return sub || "-"
  }

  const getSupplierName = (supplier: string) => {
    return supplier || "-"
  }

  // Filter and sort products
  const filteredProducts = safeProducts.filter(
    (product) =>
      (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      getCategoryName(product.category || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue = a[sortField] ?? ""
    let bValue = b[sortField] ?? ""

    if (typeof aValue === "string") aValue = aValue.toLowerCase()
    if (typeof bValue === "string") bValue = bValue.toLowerCase()

    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {sortedProducts.length} of {total} products
        </div>
      </div>

      {/* Products Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("id")}>
                Product ID {sortField === "id" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("sku" as keyof Product)}
              >
                SKU {sortField === "sku" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("name")}>
                Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Subcategory</TableHead>
              <TableHead>Colors</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Sizes</TableHead>
              <TableHead>Thickness</TableHead>
              <TableHead>Status</TableHead>
                             <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("updatedAt")}>
                 Updated {sortField === "updatedAt" && (sortDirection === "asc" ? "↑" : "↓")}
               </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              sortedProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/50">
                  <TableCell>
                    {product.thumbnailUrl && (
                      <img
                        src={product.thumbnailUrl || "/placeholder.svg"}
                        alt={product.name || "Product"}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">ID-{product.id}</TableCell>
                  <TableCell className="font-mono text-sm font-medium">
                    {product.sku || `Product-${product.id}`}
                  </TableCell>
                  <TableCell className="font-medium">{product.name || "Unnamed Product"}</TableCell>
                  <TableCell>{getCategoryName(product.category || "")}</TableCell>
                  <TableCell>{getSubcategoryName(product.subcategory || "")}</TableCell>
                  <TableCell>{getSupplierName(product.supplier || "")}</TableCell>
                  <TableCell>
                    {(product.colorVariants || []).length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {(product.colorVariants || []).slice(0, 6).map((c, idx) => (
                          <Badge key={idx} variant="outline">{c.name}</Badge>
                        ))}
                        {(product.colorVariants || []).length > 6 && (
                          <Badge variant="secondary">+{(product.colorVariants || []).length - 6}</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.technicalSpecifications?.length || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {product.technicalSpecifications?.flatMap(spec => spec.thicknesses?.map(t => t.thickness) || []).length || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={(product.status || "inactive") === "active" ? "default" : "secondary"}>
                      {product.status || "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onPreview(product)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(product)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStatus(product)}>
                          {product.status === "active" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onMarkDiscontinued(product)}>
                          Mark Discontinued
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(product)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
