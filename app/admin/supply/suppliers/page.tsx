"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowUpDown, ChevronDown, ChevronUp, MoreHorizontal, Pencil, Trash2, Copy, Plus } from 'lucide-react'
import type { Supplier, SupplierStatus } from "@/lib/suppliers-store"
import type { Category } from "@/lib/types"
import { SupplierForm } from "@/components/admin/supplier-form"
import { useToast } from "@/hooks/use-toast"
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

type SortKey = "id" | "shortName" | "companyName" | "status" | "categories"
type SortDir = "asc" | "desc"

export default function SuppliersPage() {
  const { toast } = useToast()

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
      toast({ title: "Error", description: String(e.message || e), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [search, status, toast])

  React.useEffect(() => {
    reload()
  }, [reload])

  const onDelete = async (id: string) => {
    if (!confirm("Delete this supplier?")) return
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      toast({ title: "Supplier deleted" })
      reload()
    } catch (e: any) {
      toast({ title: "Error", description: String(e.message || e), variant: "destructive" })
    }
  }

  const categoryName = React.useCallback(
    (slug: string) => categories.find((x) => x.slug === slug)?.name || slug,
    [categories],
  )

  const sortedItems = React.useMemo(() => {
    const arr = [...items]
    const val = (s: Supplier): string => {
      switch (sortKey) {
        case "id":
          return s.id.toLowerCase()
        case "shortName":
          return (s.shortName || "").toLowerCase()
        case "companyName":
          return (s.companyName || "").toLowerCase()
        case "status":
          return (s.status || "").toLowerCase()
        case "categories":
          return (s.categories || [])
            .map((slug) => categoryName(slug).toLowerCase())
            .sort()
            .join(",")
      }
    }
    arr.sort((a, b) => {
      const A = val(a)
      const B = val(b)
      if (A < B) return sortDir === "asc" ? -1 : 1
      if (A > B) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return arr
  }, [items, sortKey, sortDir, categoryName])

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const SortIcon = ({ active }: { active: boolean }) =>
    active ? (
      sortDir === "asc" ? (
        <ChevronUp className="ml-1 h-3 w-3" />
      ) : (
        <ChevronDown className="ml-1 h-3 w-3" />
      )
    ) : (
      <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
    )

  return (
    <div className="w-full px-6 xl:px-[50px] py-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Suppliers</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by ID, short name, company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[280px]"
          />
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="approved">approved</SelectItem>
              <SelectItem value="pending">pending</SelectItem>
              <SelectItem value="blocked">blocked</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setEdit(null)
              setInitial(null)
              setOpenForm(true)
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            New Supplier
          </Button>
        </div>
      </div>

      <div className={cn("overflow-hidden rounded-md border", loading ? "opacity-70" : "opacity-100")}>
        <div className="max-w-full overflow-auto">
          <Table>
            <TableCaption className="text-left">
              {loading ? "Loading…" : `${total} supplier${total === 1 ? "" : "s"}`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead
                  role="button"
                  onClick={() => onSort("id")}
                  aria-sort={sortKey === "id" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  className="min-w-[110px] cursor-pointer select-none"
                >
                  <span className="inline-flex items-center">
                    ID <SortIcon active={sortKey === "id"} />
                  </span>
                </TableHead>
                <TableHead
                  role="button"
                  onClick={() => onSort("shortName")}
                  aria-sort={sortKey === "shortName" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  className="min-w-[150px] cursor-pointer select-none"
                >
                  <span className="inline-flex items-center">
                    Short Name <SortIcon active={sortKey === "shortName"} />
                  </span>
                </TableHead>
                <TableHead
                  role="button"
                  onClick={() => onSort("companyName")}
                  aria-sort={sortKey === "companyName" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  className="min-w-[260px] cursor-pointer select-none"
                >
                  <span className="inline-flex items-center">
                    Company <SortIcon active={sortKey === "companyName"} />
                  </span>
                </TableHead>
                <TableHead
                  role="button"
                  onClick={() => onSort("status")}
                  aria-sort={sortKey === "status" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  className="min-w-[140px] cursor-pointer select-none"
                >
                  <span className="inline-flex items-center">
                    Status <SortIcon active={sortKey === "status"} />
                  </span>
                </TableHead>
                <TableHead
                  role="button"
                  onClick={() => onSort("categories")}
                  aria-sort={sortKey === "categories" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  className="min-w-[260px] cursor-pointer select-none"
                >
                  <span className="inline-flex items-center">
                    Categories <SortIcon active={sortKey === "categories"} />
                  </span>
                </TableHead>
                <TableHead className="min-w-[96px] text-right">{""}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map((s) => (
                <TableRow
                  key={s.id}
                  onClick={() => {
                    setEdit(s)
                    setInitial(null)
                    setOpenForm(true)
                  }}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {s.id}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{s.shortName}</TableCell>
                  <TableCell className="truncate">{s.companyName}</TableCell>
                  <TableCell>
                    <Badge className="capitalize">{s.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(s.categories || []).map((slug) => (
                        <Badge key={slug} variant="outline" className="text-xs">
                          {categoryName(slug)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => {
                            setEdit(s)
                            setInitial(null)
                            setOpenForm(true)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => {
                            setEdit(null)
                            setInitial({
                              id: "",
                              shortName: `${s.shortName} Copy`,
                              companyName: s.companyName,
                              contactPerson: s.contactPerson,
                              contactEmail: s.contactEmail,
                              contactPhone: s.contactPhone,
                              messenger: s.messenger,
                              website: s.website,
                              categories: s.categories,
                              status: s.status,
                            })
                            setOpenForm(true)
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-red-600 focus:text-red-600"
                          onClick={() => onDelete(s.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No suppliers found
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      <SupplierForm
        open={openForm}
        onOpenChange={(v) => {
          setOpenForm(v)
          if (!v) {
            setEdit(null)
            setInitial(null)
          }
        }}
        supplier={edit}
        initial={initial || undefined}
        categories={categories}
        onSaved={() => reload()}
      />
    </div>
  )
}
