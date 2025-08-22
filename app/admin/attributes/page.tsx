"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Attribute, Category } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Tag } from "lucide-react"
import { useState, useMemo } from "react"
import { AttributeForm } from "@/components/admin/attribute-form"
import { useToast } from "@/hooks/use-toast"

async function fetchAttributes() {
  const res = await fetch("/api/attributes")
  if (!res.ok) throw new Error("Failed to load attributes")
  return (await res.json()) as { items: Attribute[] }
}

async function fetchCategories() {
  const res = await fetch("/api/categories")
  if (!res.ok) throw new Error("Failed to load categories")
  return (await res.json()) as { items: Category[] }
}

export default function AttributesPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["attributes"], queryFn: fetchAttributes })
  const { data: catData } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories })
  const cats = catData?.items ?? []

  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<Attribute | null>(null)
  const [search, setSearch] = useState("")

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/attributes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attributes"] })
      toast({ title: "Deleted" })
    },
  })

  const items = useMemo(
    () =>
      (data?.items ?? []).filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) || a.code.toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search],
  )

  const getCatName = (id: string) => cats.find((c) => c.id === id)?.name || "—"

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Attributes</h1>
        <Button
          onClick={() => {
            setEdit(null)
            setOpen(true)
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          New Attribute
        </Button>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Input placeholder="Search attributes..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="p-6 text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="p-6 text-muted-foreground">No attributes</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols=3">
          {items.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {a.name}
                    <span className="text-xs text-muted-foreground">({a.code})</span>
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEdit(a)
                        setOpen(true)
                      }}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(a.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{a.type}</Badge>
                  {a.required ? <Badge className="bg-emerald-100 text-emerald-700">required</Badge> : null}
                  {a.public ? <Badge className="bg-blue-100 text-blue-700">public</Badge> : <Badge>private</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {a.type === "number" ? (
                  <div className="text-muted-foreground">
                    {a.unit ? `Unit: ${a.unit} • ` : ""}
                    {a.min !== undefined ? `Min: ${a.min} • ` : ""}
                    {a.max !== undefined ? `Max: ${a.max} • ` : ""}
                    {a.step !== undefined ? `Step: ${a.step}` : ""}
                  </div>
                ) : null}
                {(a.type === "select" || a.type === "multiselect" || a.type === "color") && a.options?.length ? (
                  <div>
                    <div className="text-muted-foreground">Options:</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {a.options.map((o, i) => (
                        <Badge key={`${o}-${i}`} variant="outline">
                          {o}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div>
                  <div className="text-muted-foreground">Categories:</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {a.categoryIds.length ? (
                      a.categoryIds.map((id) => (
                        <Badge key={id} variant="secondary">
                          {getCatName(id)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AttributeForm open={open} onOpenChange={setOpen} attribute={edit} />
    </div>
  )
}
