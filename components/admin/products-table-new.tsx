"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Copy, Trash2, Search, Eye } from "lucide-react"

interface Product {
  id: number
  name: string
  sku?: string
  slug: string
  description?: string
  price: number
  category_id: number
  image_url?: string
  in_stock: boolean
  created_at: string
  updated_at: string
  specifications?: {
    supplierId?: string
    subcategoryId?: string
    colorVariants?: Array<{ name: string; image: string }>
    technicalSpecifications?: Array<any>
    productSpecifications?: any
    interiorApplications?: Array<any>
  }
}

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
  const [sortField, setSortField] = useState<keyof Product>("id")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const safeProducts = data || []

  console.log("[v0] ProductsTableNew rendered with:", {
    productsCount: safeProducts.length,
    total: total,
    loading: loading,
  })

  const getCategoryName = (categoryId: number) => {
    return `Category ${categoryId}`
  }

  const getSubcategoryName = (subcategoryId?: string) => {
    return subcategoryId ? `Sub-${subcategoryId.slice(0, 8)}` : "-"
  }

  const getSupplierName = (supplierId?: string) => {
    return supplierId ? `Supplier ${supplierId}` : "-"
  }

  // Filter and sort products
  const filteredProducts = safeProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      getCategoryName(product.category_id).toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]

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
              <TableHead>Supplier</TableHead>
              <TableHead>Sizes</TableHead>
              <TableHead>Thickness</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("updated_at")}>
                Updated {sortField === "updated_at" && (sortDirection === "asc" ? "↑" : "↓")}
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
                    {product.image_url && (
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">ID-{product.id}</TableCell>
                  <TableCell className="font-mono text-sm font-medium">
                    {product.sku || `Product-${product.id}`}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{getCategoryName(product.category_id)}</TableCell>
                  <TableCell>{getSubcategoryName(product.specifications?.subcategoryId)}</TableCell>
                  <TableCell>{getSupplierName(product.specifications?.supplierId)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.specifications?.technicalSpecifications?.length || 0}</Badge>
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    <Badge variant={product.in_stock ? "default" : "secondary"}>
                      {product.in_stock ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(product.updated_at).toLocaleDateString()}
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
                        <DropdownMenuItem onClick={() => onToggleStatus(product)}>Toggle Status</DropdownMenuItem>
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
