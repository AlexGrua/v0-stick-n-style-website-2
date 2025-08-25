"use client"

import React, { useState, useEffect } from "react"
import type { Category } from "@/lib/types"
import { UnifiedTable, TableColumn, TableAction } from "@/components/admin/unified-table"
import { CategoryForm } from "@/components/admin/category-form"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react"

async function fetchCategories() {
  const res = await fetch("/api/categories")
  if (!res.ok) throw new Error("Failed to load categories")
  return (await res.json()) as { items: Category[] }
}

export default function CategoriesPage() {
  const { handleApiError, handleSuccess } = useErrorHandler()
  const [data, setData] = useState<{ items: Category[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<Category | null>(null)
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState("name")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const result = await fetchCategories()
      setData(result)
    } catch (error) {
      handleApiError(error, "Failed to load categories")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleDelete = async (category: Category) => {
    if (!confirm("Delete this category?")) return
    
    try {
      console.log('🗑️ Удаляем категорию:', category.id)
      
      const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" })
      
      // Пытаемся получить JSON ответ
      let data: any = {}
      try {
        data = await res.json()
      } catch (e) {
        // Если JSON не получен, используем пустой объект
        console.log('📡 Ответ сервера (не JSON):', { status: res.status })
      }
      
      console.log('📡 Ответ сервера:', { status: res.status, data })
      
      if (!res.ok) {
        console.error('❌ Ошибка удаления:', data)
        handleApiError(data, "Failed to delete category")
        return
      }
      
      console.log('✅ Категория удалена успешно')
      await loadCategories()
      handleSuccess("Success", "Category deleted successfully")
    } catch (error) {
      console.error("❌ Ошибка в handleDelete:", error)
      handleApiError(error, "Failed to delete category")
    }
  }

  const onToggleStatus = async (category: Category) => {
    const newStatus = category.status === "active" ? "inactive" : "active"
    const actionText = newStatus === "active" ? "activate" : "deactivate"
    
    if (!confirm(`Are you sure you want to ${actionText} this category?`)) return
    
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        handleApiError(data, "Status update failed")
        return
      }
      
      handleSuccess("Status updated", `Category ${actionText}d successfully`)
      loadCategories()
    } catch (error) {
      console.error("Toggle status error:", error)
      handleApiError(error, "Failed to update category status")
    }
  }

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm)
  }

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field)
    setSortOrder(direction)
  }

  const filteredAndSortedItems = React.useMemo(() => {
    let items = data?.items || []
    
    // Filter by search
    if (search) {
      items = items.filter((c) => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // Sort
    items = [...items].sort((a, b) => {
      let aValue: any = a[sortField as keyof Category]
      let bValue: any = b[sortField as keyof Category]
      
      if (sortField === 'created_at') {
        aValue = new Date(aValue || 0).getTime()
        bValue = new Date(bValue || 0).getTime()
      } else {
        aValue = String(aValue || '').toLowerCase()
        bValue = String(bValue || '').toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
    
    return items
  }, [data?.items, search, sortField, sortOrder])

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
      key: "name",
      label: "Name",
      sortable: true,
      className: "font-medium"
    },
    {
      key: "slug",
      label: "Slug",
      sortable: true,
      className: "font-mono text-sm"
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
    },
    {
      key: "subcategories",
      label: "Subcategories",
      render: (value) => {
        if (value && Array.isArray(value) && value.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((sub: any, index: number) => (
                <Badge key={sub.id || index} variant="secondary" className="text-xs">
                  {sub.name}
                </Badge>
              ))}
            </div>
          )
        }
        return <span className="text-sm text-muted-foreground">No subcategories</span>
      }
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      className: "text-sm text-muted-foreground",
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    }
  ]

  // Define table actions
  const actions: TableAction[] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Edit className="mr-2 h-4 w-4" />,
      onClick: (category) => {
        setEdit(category)
        setOpen(true)
      }
    },
    {
      key: "toggleStatus",
      label: (category: Category) => category.status === "active" ? "Deactivate" : "Activate",
      icon: (category: Category) => category.status === "active" 
        ? <XCircle className="mr-2 h-4 w-4" />
        : <CheckCircle className="mr-2 h-4 w-4" />,
      onClick: async (category) => {
        try {
          await onToggleStatus(category)
        } catch (error) {
          console.error("Toggle status action error:", error)
          handleApiError(error, "Failed to update category status")
        }
      },
      variant: "secondary"
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      onClick: async (category) => {
        try {
          await handleDelete(category)
        } catch (error) {
          console.error("Delete action error:", error)
          handleApiError(error, "Failed to delete category")
        }
      },
      variant: "destructive"
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Categories Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage product categories and their subcategories
        </p>
      </div>

      <UnifiedTable
        data={filteredAndSortedItems}
        columns={columns}
        actions={actions}
        total={data?.items?.length || 0}
        loading={isLoading}
        searchPlaceholder="Search categories..."
        onSearch={handleSearch}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortOrder}
        onAdd={() => {
          setEdit(null)
          setOpen(true)
        }}
        addButtonLabel="Add Category"
        emptyMessage="No categories found"
        loadingMessage="Loading categories..."
      />

      <CategoryForm open={open} onOpenChange={setOpen} category={edit} onSuccess={loadCategories} />
    </div>
  )
}
