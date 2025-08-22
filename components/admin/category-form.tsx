"use client"

import { useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { Category } from "@/lib/types"

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().optional(),
  subs: z.array(z.object({ id: z.string().optional(), name: z.string().min(1) })).default([]),
})

type FormValues = z.infer<typeof schema>

export function CategoryForm({
  open,
  onOpenChange,
  category,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  category: Category | null
}) {
  const qc = useQueryClient()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", subs: [] },
  })

  useEffect(() => {
    if (category) {
      form.reset({ id: category.id, name: category.name, slug: category.slug, subs: category.subs })
    } else {
      form.reset({ name: "", slug: "", subs: [] })
    }
  }, [category])

  const mut = useMutation({
    mutationFn: async (values: FormValues) => {
      const method = values.id ? "PUT" : "POST"
      const url = values.id ? `/api/categories/${values.id}` : "/api/categories"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          subs: values.subs.map((s) => ({ id: s.id ?? undefined, name: s.name })),
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      return await res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] })
      onOpenChange(false)
    },
  })

  const subs = form.watch("subs") || []
  function addSub(name: string) {
    const val = name.trim()
    if (!val) return
    form.setValue("subs", [...subs, { name: val }], { shouldDirty: true })
  }
  function removeSub(index: number) {
    const next = [...subs]
    next.splice(index, 1)
    form.setValue("subs", next, { shouldDirty: true })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "New Category"}</DialogTitle>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={form.handleSubmit((v) => mut.mutate(v))}>
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input {...form.register("name")} required />
          </div>
          <div className="grid gap-2">
            <Label>Slug (optional)</Label>
            <Input {...form.register("slug")} placeholder="auto-generated from name" />
          </div>
          <div className="grid gap-2">
            <Label>Subcategories</Label>
            <div className="mb-2 flex flex-wrap gap-2">
              {subs.map((s, i) => (
                <span
                  key={`${s.name}-${i}`}
                  className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs"
                >
                  {s.name}
                  <button type="button" onClick={() => removeSub(i)} aria-label="remove sub">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <Input
              placeholder="Type subcategory and press Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  const val = (e.target as HTMLInputElement).value
                  addSub(val)
                  ;(e.target as HTMLInputElement).value = ""
                }
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">Press Enter to add</p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mut.isPending}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
