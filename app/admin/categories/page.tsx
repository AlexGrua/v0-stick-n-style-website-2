"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import type { Category } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { CategoryForm } from "@/components/admin/category-form"
import { useToast } from "@/hooks/use-toast"

async function fetchCategories() {
  const res = await fetch("/api/categories")
  if (!res.ok) throw new Error("Failed to load categories")
  return (await res.json()) as { items: Category[] }
}

export default function CategoriesPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories })
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<Category | null>(null)
  const [search, setSearch] = useState("")

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] })
      toast({ title: "Deleted" })
    },
  })

  const items = (data?.items ?? []).filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <Button
          onClick={() => {
            setEdit(null)
            setOpen(true)
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          New Category
        </Button>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Input placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="p-6 text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="p-6 text-muted-foreground">No categories</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 p-1">
          {items.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEdit(c)
                        setOpen(true)
                      }}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(c.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">slug: {c.slug}</div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {c.subs.length ? (
                    c.subs.map((s) => <Badge key={s.id || s.name}>{s.name}</Badge>)
                  ) : (
                    <span className="text-sm text-muted-foreground">No subcategories</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CategoryForm open={open} onOpenChange={setOpen} category={edit} />
    </div>
  )
}
