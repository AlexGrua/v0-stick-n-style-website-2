"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Container } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Package } from "lucide-react"
import { ContainerForm } from "@/components/admin/container-form"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

type ContainerEx = Container & { visible?: boolean }

async function fetchContainers() {
  const res = await fetch("/api/containers")
  if (!res.ok) throw new Error("Failed to load containers")
  return (await res.json()) as { items: ContainerEx[] }
}

export default function Page() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["containers"], queryFn: fetchContainers })
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<ContainerEx | null>(null)

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/containers/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["containers"] })
      toast({ title: "Deleted" })
    },
  })

  // Keep original UI; only add "Visible" toggle. Default is true if undefined.
  const toggleVisible = useMutation({
    mutationFn: async (c: ContainerEx) => {
      const res = await fetch(`/api/containers/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...c, visible: !(c.visible ?? true) }),
      })
      if (!res.ok) throw new Error("Update failed")
      return await res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["containers"] })
    },
  })

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Containers</h1>
        <Button
          onClick={() => {
            setEdit(null)
            setOpen(true)
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          New Container
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (data?.items?.length ?? 0) === 0 ? (
        <div className="text-muted-foreground">No containers</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data!.items.map((c) => {
            const isVisible = c.visible ?? true
            return (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {c.name} <span className="text-xs text-muted-foreground">({c.code})</span>
                      {!isVisible && <Badge variant="secondary">Hidden</Badge>}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Visible</span>
                        <Switch
                          checked={isVisible}
                          onCheckedChange={() => toggleVisible.mutate(c)}
                          aria-label={`Toggle visibility for ${c.name}`}
                        />
                      </div>
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
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded border p-2 text-center">
                      <div className="text-xs text-muted-foreground">Capacity KG</div>
                      <div className="text-lg font-semibold">{c.capacityKg}</div>
                    </div>
                    <div className="rounded border p-2 text-center">
                      <div className="text-xs text-muted-foreground">Capacity m³</div>
                      <div className="text-lg font-semibold">{c.capacityM3}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ContainerForm open={open} onOpenChange={setOpen} container={edit} />
    </div>
  )
}
