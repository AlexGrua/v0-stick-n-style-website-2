"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { Attribute, AttributeType, Category } from "@/lib/types"
import { X } from "lucide-react"

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(["text", "number", "boolean", "select", "multiselect", "color"]),
  required: z.boolean().default(false),
  public: z.boolean().default(true),
  unit: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  step: z.coerce.number().optional(),
  options: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
  order: z.coerce.number().optional(),
})

type FormValues = z.infer<typeof schema>

async function fetchCategories() {
  const res = await fetch("/api/categories")
  if (!res.ok) throw new Error("Failed to load categories")
  return (await res.json()) as { items: Category[] }
}

export function AttributeForm({
  open,
  onOpenChange,
  attribute,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  attribute: Attribute | null
  onSuccess?: () => void
}) {
  const [catData, setCatData] = useState<{ items: Category[] } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const cats = catData?.items ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "",
      type: "text",
      required: false,
      public: true,
      options: [],
      categoryIds: [],
    },
  })

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await fetchCategories()
        setCatData(result)
      } catch (error) {
        console.error("Failed to load categories:", error)
      }
    }

    if (open) {
      loadCategories()
    }
  }, [open])

  useEffect(() => {
    if (attribute) {
      form.reset({
        id: attribute.id,
        name: attribute.name,
        code: attribute.code,
        type: attribute.type,
        required: attribute.required,
        public: attribute.public,
        unit: attribute.unit,
        min: attribute.min,
        max: attribute.max,
        step: attribute.step,
        options: attribute.options ?? [],
        categoryIds: attribute.categoryIds ?? [],
        order: attribute.order,
      })
    } else {
      form.reset({
        name: "",
        code: "",
        type: "text",
        required: false,
        public: true,
        options: [],
        categoryIds: [],
      })
    }
  }, [attribute])

  const handleSave = async (values: FormValues) => {
    try {
      setIsSaving(true)
      const method = values.id ? "PUT" : "POST"
      const url = values.id ? `/api/attributes/${values.id}` : "/api/attributes"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error("Save failed")

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Save failed:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const opts = form.watch("options")
  const type = form.watch("type")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{attribute ? "Edit Attribute" : "New Attribute"}</DialogTitle>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={form.handleSubmit(handleSave)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input {...form.register("name")} required />
            </div>
            <div className="grid gap-2">
              <Label>Code</Label>
              <Input {...form.register("code")} required placeholder="e.g., surface_finish" />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={type}
                onChange={(e) => form.setValue("type", e.target.value as AttributeType, { shouldDirty: true })}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="select">Select</option>
                <option value="multiselect">Multiselect</option>
                <option value="color">Color</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Order</Label>
              <Input type="number" {...form.register("order", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.watch("required")} onCheckedChange={(v) => form.setValue("required", !!v)} />
              Required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.watch("public")} onCheckedChange={(v) => form.setValue("public", !!v)} />
              Public
            </label>
          </div>

          {type === "number" ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Unit</Label>
                <Input placeholder="e.g., mm" {...form.register("unit")} />
              </div>
              <div className="grid gap-2">
                <Label>Min</Label>
                <Input type="number" step="0.01" {...form.register("min", { valueAsNumber: true })} />
              </div>
              <div className="grid gap-2">
                <Label>Max</Label>
                <Input type="number" step="0.01" {...form.register("max", { valueAsNumber: true })} />
              </div>
              <div className="grid gap-2">
                <Label>Step</Label>
                <Input type="number" step="0.01" {...form.register("step", { valueAsNumber: true })} />
              </div>
            </div>
          ) : null}

          {(type === "select" || type === "multiselect" || type === "color") && (
            <div className="grid gap-2">
              <Label>Options</Label>
              <div className="mb-2 flex flex-wrap gap-2">
                {(opts || []).map((v, i) => (
                  <span key={`${v}-${i}`} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs">
                    {v}
                    <button
                      type="button"
                      onClick={() =>
                        form.setValue(
                          "options",
                          (opts || []).filter((x) => x !== v),
                          { shouldDirty: true },
                        )
                      }
                      aria-label={`Remove ${v}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                placeholder="Type option and press Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    const val = (e.target as HTMLInputElement).value.trim()
                    if (val) form.setValue("options", Array.from(new Set([...(opts || []), val])))
                    ;(e.target as HTMLInputElement).value = ""
                  }
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">Press Enter to add</p>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-4">
              {cats.map((c) => {
                const checked = (form.watch("categoryIds") || []).includes(c.id)
                return (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const cur = new Set(form.watch("categoryIds") || [])
                        if (v) cur.add(c.id)
                        else cur.delete(c.id)
                        form.setValue("categoryIds", Array.from(cur), { shouldDirty: true })
                      }}
                    />
                    {c.name}
                  </label>
                )
              })}
            </div>
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
