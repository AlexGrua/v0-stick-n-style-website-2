"use client"

import { useEffect, useMemo } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Product, ProductStatus, Category } from "@/lib/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDropzone } from "react-dropzone"
import { uploadImage } from "@/lib/image-upload"

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(3).max(100),
  category: z.string().min(1),
  sub: z.string().min(1),
  description: z.string().optional(),
  thickness: z.array(z.string()).min(1, "Thickness is required"),
  sizes: z.array(z.string()).min(1, "Sizes is required"),
  pcsPerBox: z.coerce.number().int().min(1).max(1000),
  boxKg: z.coerce.number().min(0.1).max(1000),
  boxM3: z.coerce.number().min(0.001).max(100),
  minOrderBoxes: z.coerce.number().int().min(1).optional(),
  status: z.custom<ProductStatus>().default("active"),
  tags: z.array(z.string()).default([]),
  customFields: z.any().optional(),
  thumbnailUrl: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

async function fetchCategories() {
  const res = await fetch("/api/categories")
  if (!res.ok) throw new Error("Failed to load categories")
  return (await res.json()) as { items: Category[] }
}

export function ProductForm({
  open,
  onOpenChange,
  product,
}: { open: boolean; onOpenChange: (v: boolean) => void; product: Product | null }) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data: catData } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      category: "wall-panel",
      sub: "Sub 1",
      thickness: [],
      sizes: [],
      pcsPerBox: 10,
      boxKg: 10,
      boxM3: 0.2,
      status: "active",
      tags: [],
    },
  })

  useEffect(() => {
    if (product) {
      form.reset({
        id: product.id,
        name: product.name,
        category: product.category,
        sub: product.sub,
        description: product.description,
        thickness: product.thickness ?? [],
        sizes: product.sizes ?? [],
        pcsPerBox: product.pcsPerBox,
        boxKg: product.boxKg,
        boxM3: product.boxM3,
        minOrderBoxes: product.minOrderBoxes,
        status: product.status,
        tags: product.tags ?? [],
        thumbnailUrl: product.thumbnailUrl,
      })
    } else {
      form.reset({
        name: "",
        category: "wall-panel",
        sub: "Sub 1",
        thickness: [],
        sizes: [],
        pcsPerBox: 10,
        boxKg: 10,
        boxM3: 0.2,
        status: "active",
        tags: [],
      })
    }
  }, [product])

  const mut = useMutation({
    mutationFn: async (values: FormValues) => {
      const method = values.id ? "PUT" : "POST"
      const url = values.id ? `/api/products/${values.id}` : "/api/products"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Save failed")
      }
      return await res.json()
    },
    onSuccess: () => {
      toast({ title: "Saved" })
      qc.invalidateQueries({ queryKey: ["products"] })
      onOpenChange(false)
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  })

  function FieldError({ name }: { name: keyof FormValues }) {
    const err = (form.formState.errors as any)[name]
    if (!err) return null
    return <p className="mt-1 text-xs text-red-600">{err.message as string}</p>
  }

  // Simple multi-input chips
  function ChipsField({
    name,
    placeholder,
    label,
  }: {
    name: "sizes" | "thickness" | "tags"
    placeholder: string
    label?: string
  }) {
    const vals = form.watch(name) as string[]
    const add = (v: string) => {
      if (!v) return
      const next = Array.from(new Set([...(vals || []), v]))
      form.setValue(name, next as any, { shouldDirty: true, shouldValidate: true })
    }
    const remove = (v: string) =>
      form.setValue(name, (vals || []).filter((x) => x !== v) as any, { shouldDirty: true, shouldValidate: true })

    return (
      <div>
        {label ? <Label>{label}</Label> : null}
        <div className="mb-2 mt-1 flex flex-wrap gap-2">
          {(vals || []).map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs">
              {v}
              <button type="button" onClick={() => remove(v)} aria-label={`Remove ${v}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <Input
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              const val = (e.target as HTMLInputElement).value.trim()
              if (val) add(val)
              ;(e.target as HTMLInputElement).value = ""
            }
          }}
        />
      </div>
    )
  }

  // Image dropzone (preview only, mock upload)
  const dz = useDropzone({
    multiple: false,
    accept: { "image/*": [] },
    maxSize: 10 * 1024 * 1024,
    onDropAccepted: async (files) => {
      const file = files[0]
      try {
        console.log("[v0] Uploading thumbnail:", file.name)
        const permanentUrl = await uploadImage(file)
        form.setValue("thumbnailUrl", permanentUrl)
        console.log("[v0] Thumbnail uploaded successfully")
      } catch (error) {
        console.error("[v0] Thumbnail upload failed:", error)
      }
    },
  })

  const categories = catData?.items ?? []
  const selectedCat = useMemo(
    () => categories.find((c) => c.slug === form.watch("category")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories, form.watch("category")],
  )
  const subs = selectedCat?.subs ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "New Product"}</DialogTitle>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={form.handleSubmit((v) => mut.mutate(v))}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input {...form.register("name")} required />
              <FieldError name="name" />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(v: string) => {
                  form.setValue("category", v, { shouldDirty: true })
                  const first = (categories.find((c) => c.slug === v)?.subs ?? [])[0]?.name || "Sub 1"
                  form.setValue("sub", first, { shouldDirty: true })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Subcategory</Label>
              <Select value={form.watch("sub")} onValueChange={(v) => form.setValue("sub", v, { shouldDirty: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Sub" />
                </SelectTrigger>
                <SelectContent>
                  {(subs.length ? subs.map((s) => s.name) : ["Sub 1"]).map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError name="sub" />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v: any) => form.setValue("status", v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Pcs/Box</Label>
              <Input type="number" {...form.register("pcsPerBox", { valueAsNumber: true })} min={1} />
              <FieldError name="pcsPerBox" />
            </div>
            <div className="grid gap-2">
              <Label>Box Weight (kg)</Label>
              <Input type="number" step="0.01" {...form.register("boxKg", { valueAsNumber: true })} min={0.1} />
              <FieldError name="boxKg" />
            </div>
            <div className="grid gap-2">
              <Label>Box Volume (m³)</Label>
              <Input type="number" step="0.001" {...form.register("boxM3", { valueAsNumber: true })} min={0.001} />
              <FieldError name="boxM3" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <ChipsField name="sizes" placeholder="e.g., 60×60cm (press Enter)" label="Sizes (required)" />
              <FieldError name="sizes" />
            </div>
            <div>
              <ChipsField name="thickness" placeholder="e.g., 2 mm (press Enter)" label="Thickness (required)" />
              <FieldError name="thickness" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea rows={3} {...form.register("description")} />
          </div>

          <div className="grid gap-2">
            <Label>Thumbnail</Label>
            <div
              {...dz.getRootProps()}
              className={cn(
                "flex h-28 cursor-pointer items-center justify-center rounded border border-dashed",
                dz.isDragActive && "bg-muted",
              )}
            >
              <input {...dz.getInputProps()} />
              {form.watch("thumbnailUrl") ? (
                <img
                  src={form.watch("thumbnailUrl") || "/placeholder.svg"}
                  alt="preview"
                  className="h-24 w-24 rounded border object-cover"
                />
              ) : (
                <span className="text-sm text-muted-foreground">Drop image here or click to upload</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
