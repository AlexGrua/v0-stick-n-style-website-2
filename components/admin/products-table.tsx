"use client"

import { Card } from "@/components/ui/card"
import * as React from "react"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  MoreHorizontal,
  Pencil,
  Eye,
  Copy,
  Trash2,
  Hash,
  FileDown,
  Link2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

function StatusBadge({ status }: { status: Product["status"] }) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-muted text-muted-foreground",
    discontinued: "bg-amber-100 text-amber-800",
  }
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] ${map[status] || "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  )
}

function SortHeader({
  label,
  sortKey,
  currentSort,
  onSort,
}: {
  label: string
  sortKey: string
  currentSort: { key: string; direction: "asc" | "desc" } | null
  onSort: (key: string) => void
}) {
  const isSorted = currentSort?.key === sortKey
  const direction = isSorted ? currentSort?.direction : null
  const Icon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-left text-xs hover:text-foreground"
      onClick={() => onSort(sortKey)}
    >
      <span>{label}</span>
      <Icon className="h-3 w-3 text-muted-foreground" />
    </button>
  )
}

function fmtDate(input?: string | number | Date) {
  if (!input) return "-"
  try {
    const d = new Date(input)
    if (Number.isNaN(d.getTime())) return "-"
    return d.toLocaleDateString()
  } catch {
    return "-"
  }
}

function productToCsvRow(p: Product) {
  const anyP = p as any
  return {
    id: anyP.id ?? "",
    sku: anyP.sku ?? "",
    name: anyP.name ?? "",
    category: anyP.category ?? "",
    subcategory: anyP.subcategory ?? "",
    supplierName: anyP.supplierName ?? "",
    sizes: (anyP.sizes ?? []).join("|"),
    thickness: (anyP.thickness ?? []).join("|"),
    status: anyP.status ?? "",
    createdAt: anyP.createdAt ?? "",
    updatedAt: anyP.updatedAt ?? "",
  }
}

function downloadCsv(filename: string, row: Record<string, any>) {
  const headers = Object.keys(row)
  const values = headers.map((h) => {
    const v = row[h]
    const s = v == null ? "" : String(v)
    return `"${s.replace(/"/g, '""')}"`
  })
  const csv = headers.join(",") + "\n" + values.join(",") + "\n"
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function DataTable({
  data,
  total,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onMarkDiscontinued,
  onPreview,
  onSelectionChange,
  onDuplicate,
  onExportCSV,
}: {
  data: Product[]
  total: number
  loading: boolean
  onEdit: (p: Product) => void
  onDelete: (p: Product) => void
  onToggleStatus: (p: Product) => void
  onMarkDiscontinued: (p: Product) => void
  onPreview?: (p: Product) => void
  onSelectionChange?: (selected: Product[]) => void
  onDuplicate?: (p: Product) => void
  onExportCSV?: (p: Product) => void
}) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: "asc" | "desc" } | null>({
    key: "updatedAt",
    direction: "desc",
  })
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 50

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortConfig.key]
      const bVal = (b as any)[sortConfig.key]

      if (aVal === bVal) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      const comparison = aVal < bVal ? -1 : 1
      return sortConfig.direction === "desc" ? -comparison : comparison
    })
  }, [data, sortConfig])

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedData.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedData, currentPage])

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" }
      }
      return { key, direction: "asc" }
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedData.map((p) => (p as any).id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  // Notify parent when selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selected = data.filter((p) => selectedIds.has((p as any).id))
      onSelectionChange(selected)
    }
  }, [selectedIds, data, onSelectionChange])

  const allSelected = paginatedData.length > 0 && paginatedData.every((p) => selectedIds.has((p as any).id))
  const someSelected = paginatedData.some((p) => selectedIds.has((p as any).id))

  return (
    <Card className="overflow-hidden">
      <div className="h-[60vh] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr className="text-left">
              <th className="border-b px-2 py-1.5 w-8">
                <Checkbox
                  checked={allSelected || (someSelected && "indeterminate")}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th className="border-b px-2 py-1.5 w-12">Img</th>
              <th className="border-b px-2 py-1.5 w-24">
                <SortHeader label="Product ID" sortKey="id" currentSort={sortConfig} onSort={handleSort} />
              </th>
              <th className="border-b px-2 py-1.5 w-32">
                <SortHeader label="SKU" sortKey="sku" currentSort={sortConfig} onSort={handleSort} />
              </th>
              <th className="border-b px-2 py-1.5">
                <SortHeader label="Name" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
              </th>
              <th className="border-b px-2 py-1.5 w-32">
                <SortHeader label="Category" sortKey="category" currentSort={sortConfig} onSort={handleSort} />
              </th>
              <th className="border-b px-2 py-1.5 w-28">
                <SortHeader label="Subcategory" sortKey="subcategory" currentSort={sortConfig} onSort={handleSort} />
              </th>
              <th className="border-b px-2 py-1.5 w-32">
                <SortHeader label="Supplier" sortKey="supplierName" currentSort={sortConfig} onSort={handleSort} />
              </th>
              <th className="border-b px-2 py-1.5 w-36">Sizes</th>
              <th className="border-b px-2 py-1.5 w-32">Thickness</th>
              <th className="border-b px-2 py-1.5 w-24">
                <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
              </th>
              <th className="border-b px-2 py-1.5 w-28">
                <SortHeader label="Updated" sortKey="updatedAt" currentSort={sortConfig} onSort={handleSort} />
              </th>
              <th className="border-b px-2 py-1.5 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} className="px-2 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : paginatedData.length ? (
              paginatedData.map((p) => {
                const anyP = p as any
                const isSelected = selectedIds.has(anyP.id)
                const isInactive = anyP.status === "inactive"
                const isDiscontinued = anyP.status === "discontinued"
                const toggleLabel = isDiscontinued ? "Mark Active" : isInactive ? "Mark Active" : "Mark Inactive"

                return (
                  <tr key={anyP.id} className="cursor-pointer hover:bg-muted/60" onDoubleClick={() => onPreview?.(p)}>
                    <td className="border-b px-2 py-1.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectRow(anyP.id, !!checked)}
                        aria-label="Select row"
                      />
                    </td>
                    <td className="border-b px-2 py-1.5">
                      <img
                        src={anyP.thumbnailUrl || "/placeholder.svg?height=32&width=32&query=product%20thumb"}
                        alt=""
                        className="h-8 w-8 rounded border object-cover"
                      />
                    </td>
                    <td className="border-b px-2 py-1.5">
                      <span className="font-mono text-[11px]">ID-{anyP.id}</span>
                    </td>
                    <td className="border-b px-2 py-1.5">
                      <span className="font-mono text-[11px]">{anyP.sku || `Product-${anyP.id}`}</span>
                    </td>
                    <td className="border-b px-2 py-1.5">{anyP.name || "-"}</td>
                    <td className="border-b px-2 py-1.5">{anyP.category || "-"}</td>
                    <td className="border-b px-2 py-1.5">{anyP.subcategory || "-"}</td>
                    <td className="border-b px-2 py-1.5">
                      <span className="truncate text-[11px]" title={anyP.supplierName || ""}>
                        {anyP.supplierName || "-"}
                      </span>
                    </td>
                    <td className="border-b px-2 py-1.5">
                      <span className="truncate" title={(anyP.sizes ?? []).join(", ")}>
                        {(anyP.sizes ?? []).length ? (anyP.sizes ?? []).join(", ") : "-"}
                      </span>
                    </td>
                    <td className="border-b px-2 py-1.5">
                      <span className="truncate" title={(anyP.thickness ?? []).join(", ")}>
                        {(anyP.thickness ?? []).length ? (anyP.thickness ?? []).join(", ") : "-"}
                      </span>
                    </td>
                    <td className="border-b px-2 py-1.5">
                      <StatusBadge status={anyP.status} />
                    </td>
                    <td className="border-b px-2 py-1.5">
                      <span className="text-[11px]">{fmtDate(anyP.updatedAt)}</span>
                    </td>
                    <td className="border-b px-2 py-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Row actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(p)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (onPreview) onPreview(p)
                              else window.open(`/catalog/${encodeURIComponent(anyP.id)}`, "_blank")
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (onDuplicate) onDuplicate(p)
                              else {
                                const draft = {
                                  ...anyP,
                                  id: undefined,
                                  sku: `${anyP.sku || "SKU"}-COPY`,
                                  name: `${anyP.name || "Product"} (Copy)`,
                                  status: "inactive",
                                }
                                navigator.clipboard.writeText(JSON.stringify(draft, null, 2))
                              }
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const url = `${location.origin}/catalog/${encodeURIComponent(anyP.id || "")}`
                              navigator.clipboard.writeText(url)
                            }}
                          >
                            <Link2 className="mr-2 h-4 w-4" /> Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(anyP.sku || "")}>
                            <Hash className="mr-2 h-4 w-4" /> Copy SKU
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (onExportCSV) onExportCSV(p)
                              else downloadCsv(`${anyP.sku || anyP.id || "product"}.csv`, productToCsvRow(p))
                            }}
                          >
                            <FileDown className="mr-2 h-4 w-4" /> Export CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onToggleStatus(p)}>{toggleLabel}</DropdownMenuItem>
                          {!isDiscontinued && (
                            <DropdownMenuItem onClick={() => onMarkDiscontinued(p)}>Mark Discontinued</DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(JSON.stringify(p, null, 2))}>
                            Copy JSON
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => onDelete(p)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={13} className="px-2 py-10 text-center text-muted-foreground">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-2 p-2">
        <div className="text-[11px] text-muted-foreground">
          Selected: {selectedIds.size} • Total: {total}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            Prev
          </Button>
          <span className="text-[11px]">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}
