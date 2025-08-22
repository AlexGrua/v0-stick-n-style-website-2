"use client"

import { Card } from "@/components/ui/card"
import * as React from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table"
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

function SortHeader({ column, label }: { column: any; label: string }) {
  const isSorted = column.getIsSorted() as false | "asc" | "desc"
  const Icon = isSorted === "asc" ? ArrowUp : isSorted === "desc" ? ArrowDown : ArrowUpDown
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-left text-xs"
      onClick={() => column.toggleSorting(isSorted === "asc")}
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
    sub: anyP.sub ?? "",
    sizes: (anyP.sizes ?? []).join("|"),
    thickness: (anyP.thickness ?? []).join("|"),
    pcsPerBox: anyP.pcsPerBox ?? "",
    boxKg: anyP.boxKg ?? "",
    boxM3: anyP.boxM3 ?? "",
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
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "updatedAt", desc: true }])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const columns = React.useMemo<ColumnDef<Product>[]>(() => {
    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select row"
          />
        ),
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "thumbnailUrl",
        header: "Img",
        cell: ({ row }) => (
          <img
            src={(row.original as any).thumbnailUrl || "/placeholder.svg?height=32&width=32&query=product%20thumb"}
            alt=""
            className="h-8 w-8 rounded border object-cover"
          />
        ),
        size: 48,
        enableSorting: false,
      },
      {
        accessorKey: "sku",
        header: ({ column }) => <SortHeader column={column} label="SKU" />,
        cell: (ctx) => <span className="font-mono text-[11px]">{(ctx.getValue() as string) || "-"}</span>,
        size: 120,
      },
      { accessorKey: "name", header: ({ column }) => <SortHeader column={column} label="Name" />, size: 180 },
      { accessorKey: "category", header: ({ column }) => <SortHeader column={column} label="Category" />, size: 120 },
      { accessorKey: "sub", header: ({ column }) => <SortHeader column={column} label="Sub" />, size: 110 },
      {
        id: "sizes",
        header: "Sizes",
        cell: ({ row }) => {
          const s = ((row.original as any).sizes ?? []) as string[]
          const sText = s.join(", ")
          return (
            <span className="truncate" title={sText || ""}>
              {s.length ? sText : "-"}
            </span>
          )
        },
        enableSorting: false,
        size: 140,
      },
      {
        id: "thickness",
        header: "Thk",
        cell: ({ row }) => {
          const t = ((row.original as any).thickness ?? []) as string[]
          const tText = t.join(", ")
          return (
            <span className="truncate" title={tText || ""}>
              {t.length ? tText : "-"}
            </span>
          )
        },
        enableSorting: false,
        size: 120,
      },
      { accessorKey: "pcsPerBox", header: ({ column }) => <SortHeader column={column} label="Pcs/Box" />, size: 70 },
      { accessorKey: "boxKg", header: ({ column }) => <SortHeader column={column} label="KG" />, size: 60 },
      { accessorKey: "boxM3", header: ({ column }) => <SortHeader column={column} label="m³" />, size: 60 },
      {
        accessorKey: "status",
        header: ({ column }) => <SortHeader column={column} label="Status" />,
        cell: ({ row }) => <StatusBadge status={(row.original as any).status} />,
        size: 90,
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => <SortHeader column={column} label="Updated" />,
        cell: ({ row }) => <span className="text-[11px]">{fmtDate((row.original as any).updatedAt)}</span>,
        size: 100,
      },
      {
        id: "actions",
        header: "",
        size: 180,
        cell: ({ row }) => {
          const p = row.original
          const anyP = p as any
          const isInactive = anyP.status === "inactive"
          const isDiscontinued = anyP.status === "discontinued"
          const toggleLabel = isDiscontinued ? "Mark Active" : isInactive ? "Mark Active" : "Mark Inactive"

          return (
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
                    else window.open(`/catalog/${encodeURIComponent((p as any).id)}`, "_blank")
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
          )
        },
      },
    ]
  }, [onEdit, onDelete, onToggleStatus, onMarkDiscontinued, onPreview, onDuplicate, onExportCSV])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // Notify parent when selection changes
  const lastSelRef = React.useRef<string>("")
  React.useEffect(() => {
    if (!onSelectionChange) return
    const selected = table.getSelectedRowModel().rows.map((r) => r.original)
    const key = selected.map((p) => (p as any).id).join("|")
    if (key !== lastSelRef.current) {
      lastSelRef.current = key
      onSelectionChange(selected)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, onSelectionChange])

  return (
    <Card className="overflow-hidden">
      <div className="h-[60vh] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="text-left">
                {hg.headers.map((h) => (
                  <th key={h.id} className="border-b px-2 py-1.5">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={table.getAllColumns().length} className="px-2 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer hover:bg-muted/60"
                  onDoubleClick={() => onPreview?.(r.original)}
                >
                  {r.getVisibleCells().map((c) => (
                    <td key={c.id} className="border-b px-2 py-1.5">
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={table.getAllColumns().length} className="px-2 py-10 text-center text-muted-foreground">
                  No products
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-2 p-2">
        <div className="text-[11px] text-muted-foreground">
          Selected: {Object.keys(rowSelection).length} • Total: {total}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </Button>
          <span className="text-[11px]">
            Page {table.getState().pagination?.pageIndex + 1 || 1} of {table.getPageCount() || 1}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}
