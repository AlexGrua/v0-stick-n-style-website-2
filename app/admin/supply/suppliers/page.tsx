"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { UnifiedTable, TableColumn, TableAction } from "@/components/admin/unified-table"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Copy, Plus, CheckCircle, XCircle } from 'lucide-react'
import type { Supplier, SupplierStatus } from "@/lib/suppliers-store"
import type { Category } from "@/lib/types"
import { SupplierForm } from "@/components/admin/supplier-form"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { cn } from "@/lib/utils"

async function loadSuppliers(params: { search?: string; status?: SupplierStatus | "all" }) {
  const q = new URLSearchParams()
  if (params.search) q.set("search", params.search)
  if (params.status && params.status !== "all") q.set("status", params.status)
  const res = await fetch(`/api/suppliers?${q.toString()}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load suppliers")
  const data = await res.json()
  
  const mappedItems = (data.items || []).map((item: any) => ({
    id: item.id,
    code: item.code || `S${item.id.toString().padStart(3, '0')}`,
    shortName: item.short_name || item.shortName,
    companyName: item.company_name || item.companyName,
    contactPerson: item.contact_person || item.contactPerson,
    contactEmail: item.contact_email || item.contactEmail,
    contactPhone: item.contact_phone || item.contactPhone,
    messenger: item.messenger,
    website: item.website,
    categories: item.categories || [],
    status: item.status
  }))
  
  return { items: mappedItems, total: data.total }
}

async function loadCategories() {
  const res = await fetch("/api/categories", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load categories")
  return (await res.json()) as { items: Category[] }
}

type SortKey = "id" | "code" | "shortName" | "companyName" | "status" | "categories"
type SortDir = "asc" | "desc"

export default function SuppliersPage() {
  const { handleApiError, handleSuccess } = useErrorHandler()

  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<SupplierStatus | "all">("all")
  const [loading, setLoading] = React.useState(true)
  const [items, setItems] = React.useState<Supplier[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [total, setTotal] = React.useState(0)

  const [openForm, setOpenForm] = React.useState(false)
  const [edit, setEdit] = React.useState<Supplier | null>(null)
  const [initial, setInitial] = React.useState<Partial<Supplier> | null>(null)

  const [sortKey, setSortKey] = React.useState<SortKey>("shortName")
  const [sortDir, setSortDir] = React.useState<SortDir>("asc")

  const reload = React.useCallback(async () => {
    setLoading(true)
    try {
      const [sup, cats] = await Promise.all([loadSuppliers({ search, status }), loadCategories()])
      setItems(sup.items)
      setTotal(sup.total)
      setCategories(cats.items)
    } catch (e: any) {
      handleApiError(e, "Failed to load suppliers")
    } finally {
      setLoading(false)
    }
  }, [search, status, handleApiError])

  React.useEffect(() => {
    reload()
  }, [reload])

  const onDelete = async (supplier: Supplier) => {
    if (!confirm("Delete this supplier?")) return
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, { method: "DELETE" })
      const data = await res.json()
      
      if (!res.ok) {
        handleApiError(data, "Delete failed")
        return
      }
      
      handleSuccess("Supplier deleted")
      reload()
    } catch (e: any) {
      handleApiError(e, "Failed to delete supplier")
    }
  }

  const onToggleStatus = async (supplier: Supplier) => {
    const newStatus = supplier.status === "active" ? "inactive" : "active"
    const actionText = newStatus === "active" ? "activate" : "deactivate"
    
    if (!confirm(`Are you sure you want to ${actionText} this supplier?`)) return
    
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        handleApiError(data, "Status update failed")
        return
      }
      
      handleSuccess("Status updated", `Supplier ${actionText}d successfully`)
      reload()
    } catch (e: any) {
      handleApiError(e, "Failed to update supplier status")
    }
  }

  const categoryName = React.useCallback(
    (slug: string) => categories.find((x) => x.slug === slug)?.name || slug,
    [categories],
  )

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm)
  }

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortKey(field as SortKey)
    setSortDir(direction)
  }

  const filteredAndSortedItems = React.useMemo(() => {
    let filteredItems = items

    // Sort
    filteredItems = [...filteredItems].sort((a, b) => {
      let aValue: any = a[sortKey as keyof Supplier]
      let bValue: any = b[sortKey as keyof Supplier]

      if (sortKey === "categories") {
        aValue = (a.categories || []).length
        bValue = (b.categories || []).length
      }

      if (typeof aValue === "string") aValue = aValue.toLowerCase()
      if (typeof bValue === "string") bValue = bValue.toLowerCase()

      if (sortDir === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filteredItems
  }, [items, sortKey, sortDir])

  // Define table columns
  const columns: TableColumn[] = [
    {
      key: "id",
      label: "ID",
      sortable: true,
      className: "font-mono text-sm",
      render: (value) => `ID-${value}`
    },
    {
      key: "code",
      label: "Code",
      sortable: true,
      className: "font-mono text-sm font-medium"
    },
    {
      key: "shortName",
      label: "Short Name",
      sortable: true,
      className: "font-medium"
    },
    {
      key: "companyName",
      label: "Company Name",
      sortable: true
    },
    {
      key: "contactPerson",
      label: "Contact Person",
      render: (value) => value || '-'
    },
    {
      key: "contactEmail",
      label: "Email",
      render: (value) => value || '-'
    },
    {
      key: "contactPhone",
      label: "Phone",
      render: (value) => value || '-'
    },
    {
      key: "categories",
      label: "Categories",
      sortable: true,
      render: (value) => {
        if (value && Array.isArray(value) && value.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((cat: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {categoryName(cat)}
                </Badge>
              ))}
            </div>
          )
        }
        return <span className="text-sm text-muted-foreground">No categories</span>
      }
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value) => (
        <Badge variant={value === "active" ? "default" : "secondary"}>
          {value || "inactive"}
        </Badge>
      )
    }
  ]

  // Define table actions
  const actions: TableAction[] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Pencil className="mr-2 h-4 w-4" />,
      onClick: (supplier) => {
        setEdit(supplier)
        setOpenForm(true)
      }
    },
    {
      key: "duplicate",
      label: "Duplicate",
      icon: <Copy className="mr-2 h-4 w-4" />,
      onClick: (supplier) => {
        setInitial(supplier)
        setOpenForm(true)
      }
    },
    {
      key: "toggleStatus",
      label: (supplier: Supplier) => supplier.status === "active" ? "Deactivate" : "Activate",
      icon: (supplier: Supplier) => supplier.status === "active" 
        ? <XCircle className="mr-2 h-4 w-4" />
        : <CheckCircle className="mr-2 h-4 w-4" />,
      onClick: onToggleStatus,
      variant: "secondary"
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      onClick: onDelete,
      variant: "destructive"
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Suppliers Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage product suppliers and their information
        </p>
      </div>

      {/* Status Filter */}
      <div className="mb-4">
        <Select value={status} onValueChange={(value: SupplierStatus | "all") => setStatus(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <UnifiedTable
        data={filteredAndSortedItems}
        columns={columns}
        actions={actions}
        total={total}
        loading={loading}
        searchPlaceholder="Search suppliers..."
        onSearch={handleSearch}
        onSort={handleSort}
        sortField={sortKey}
        sortDirection={sortDir}
        onAdd={() => {
          setEdit(null)
          setInitial(null)
          setOpenForm(true)
        }}
        addButtonLabel="Add Supplier"
        emptyMessage="No suppliers found"
        loadingMessage="Loading suppliers..."
      />

      <SupplierForm
        open={openForm}
        onOpenChange={setOpenForm}
        supplier={edit}
        initial={initial || undefined}
        categories={categories}
        onSuccess={reload}
      />
    </div>
  )
}
