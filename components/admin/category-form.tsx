"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
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
  onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  category: Category | null
  onSuccess?: () => void
}) {
  const [isSaving, setIsSaving] = useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", subs: [] },
  })

  useEffect(() => {
    if (category) {
      console.log("[v0] Setting form data for category:", category)
      form.reset({
        id: String(category.id), // Ensure ID is string
        name: category.name,
        slug: category.slug,
        subs: category.subs || [],
      })
    } else {
      console.log("[v0] Resetting form for new category")
      form.reset({ name: "", slug: "", subs: [] })
    }
  }, [category, form])

  const handleSave = async (values: FormValues) => {
    try {
      setIsSaving(true)
      console.log("[v0] Submitting category form with values:", values)
      console.log("[v0] Category ID exists:", !!values.id)
      console.log("[v0] Will use method:", values.id ? "PUT" : "POST")

      const method = values.id ? "PUT" : "POST"
      const url = values.id ? `/api/categories/${values.id}` : "/api/categories"

      console.log("[v0] Making request to:", url, "with method:", method)

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          subs: values.subs.map((s) => ({ id: s.id ?? undefined, name: s.name })),
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error("[v0] Save failed:", errorText)
        throw new Error(`Save failed: ${errorText}`)
      }

      const result = await res.json()
      console.log("[v0] Category saved successfully:", result)

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Save error:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const subs = form.watch("subs") || []
  function addSub(name: string) {
    const val = name.trim()
    if (!val) return
    const currentSubs = Array.isArray(subs) ? subs : []
    form.setValue("subs", [...currentSubs, { name: val }], { shouldDirty: true })
  }
  function removeSub(index: number) {
    const currentSubs = Array.isArray(subs) ? subs : []
    const next = [...currentSubs]
    next.splice(index, 1)
    form.setValue("subs", next, { shouldDirty: true })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "New Category"}</DialogTitle>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={form.handleSubmit(handleSave)}>
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
              {Array.isArray(subs) &&
                subs.map((s, i) => (
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
            <Button type="submit" disabled={isSaving}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
