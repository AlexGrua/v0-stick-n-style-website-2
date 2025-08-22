"use client"

import * as React from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import type { Category, Product } from "@/lib/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { Eye, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDropzone } from "react-dropzone"
import { ProductDetails } from "@/components/catalog/product-details"

type ColorItem = {
  id: string
  nameEn: string
  mainImage?: string
}

type SupplierLite = {
  id: string
  shortName: string
  companyName: string
}

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  sub: z.string().min(1, "Subcategory is required"),
  technicalDescription: z.string().min(1, "Technical description is required"),
  sizes: z.array(z.string()).min(1, "Add at least one size"),
  thickness: z.array(z.string()).min(1, "Add at least one thickness"),
  pcsPerBox: z.coerce.number().int().min(1),
  boxKg: z.coerce.number().min(0.01),
  boxM3: z.coerce.number().min(0.001),
  mainPhoto: z.string().min(1, "Main photo is required"),
  otherPhotos: z.array(z.string()).default([]),
  infographicsMain: z.string().min(1, "Infographics main is required"),
  infographicsOther: z.array(z.string()).default([]),
  colors: z.array(z.any()).default([]),
  status: z.enum(["active", "inactive", "discontinued"]).default("inactive"),
  // New: required Supplier selection
  supplierId: z.string().min(1, "Supplier is required"),
  supplierSku: z.string().optional(),
})

type FormValues = z.infer<typeof schema>
type CatResponse = { items: Category[] }
type SupResponse = { items: SupplierLite[] }

async function fetchCategories() {
  const res = await fetch("/api/categories")
  if (!res.ok) throw new Error("Failed to load categories")
  return (await res.json()) as CatResponse
}

async function fetchSuppliers() {
  const res = await fetch("/api/suppliers")
  if (!res.ok) throw new Error("Failed to load suppliers")
  const data = (await res.json()) as { items: any[] }
  // Map to lite objects
  const items: SupplierLite[] = (data.items || []).map((s: any) => ({
    id: s.id,
    shortName: s.shortName,
    companyName: s.companyName,
  }))
  return { items }
}

export function ExtendedProductForm({
  open,
  onOpenChange,
  product,
  prefillFrom,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  product: Product | null
  prefillFrom?: Product
}) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data: catData } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories })
  const categories = catData?.items ?? []
  const { data: supData } = useQuery({ queryKey: ["suppliers-lite"], queryFn: fetchSuppliers })
  const suppliers = supData?.items ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      category: "",
      sub: "",
      technicalDescription: "",
      sizes: [],
      thickness: [],
      pcsPerBox: 10,
      boxKg: 10,
      boxM3: 0.2,
      mainPhoto: "",
      otherPhotos: [],
      infographicsMain: "",
      infographicsOther: [],
      colors: [],
      status: "inactive",
      supplierId: "",
      supplierSku: "",
    },
    mode: "onChange",
    shouldUnregister: false,
  })

  // Colors state
  const [colors, setColors] = React.useState<ColorItem[]>([])
  const addColor = () => setColors((prev) => [...prev, { id: crypto.randomUUID(), nameEn: "", mainImage: "" }])
  const removeColor = (id: string) => setColors((prev) => prev.filter((c) => c.id !== id))
  const patchColor = (id: string, patch: Partial<ColorItem>) => {
    setColors((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  // one-time init/reset when dialog opens
  const initialized = React.useRef(false)
  React.useEffect(() => {
    if (!open) return
    if (initialized.current) return

    // Duplicate
    if (!product && prefillFrom) {
      const p: any = prefillFrom
      form.reset({
        name: p.name ? `${p.name}` : "",
        category: p.category || "",
        sub: p.sub || "",
        technicalDescription: p.technicalDescription || p.description || "",
        sizes: p.sizes || [],
        thickness: p.thickness || [],
        pcsPerBox: p.pcsPerBox || 10,
        boxKg: p.boxKg || 10,
        boxM3: p.boxM3 || 0.2,
        mainPhoto: p.thumbnailUrl || "",
        otherPhotos: p.photos?.others || p.gallery || [],
        infographicsMain: p.infographics?.main || "",
        infographicsOther: p.infographics?.others || [],
        colors: p.colors || [],
        status: "inactive",
        // carry supplier if exists
        supplierId: (p.customFields && p.customFields.supplierId) || "",
        supplierSku: (p.customFields && p.customFields.supplierSku) || "",
      } as any)
      const initialColors: ColorItem[] = (p?.colors || []).map((c: any) => ({
        id: c.id || crypto.randomUUID(),
        nameEn: c.nameEn || "",
        mainImage: c.mainImage || "",
      }))
      setColors(initialColors)
      initialized.current = true
      return
    }

    if (!product) {
      const firstCat = categories[0]
      form.reset({
        name: "",
        category: firstCat?.slug || "",
        sub: (firstCat?.subs || [])[0]?.name || "",
        technicalDescription: "",
        sizes: [],
        thickness: [],
        pcsPerBox: 10,
        boxKg: 10,
        boxM3: 0.2,
        mainPhoto: "",
        otherPhotos: [],
        infographicsMain: "",
        infographicsOther: [],
        colors: [],
        status: "inactive",
        supplierId: "",
        supplierSku: "",
      } as any)
      setColors([])
      initialized.current = true
      return
    }

    form.reset({
      id: product.id,
      name: product.name,
      category: product.category,
      sub: product.sub,
      technicalDescription: (product as any).technicalDescription || product.description || "",
      sizes: product.sizes || [],
      thickness: product.thickness || [],
      pcsPerBox: product.pcsPerBox,
      boxKg: product.boxKg,
      boxM3: product.boxM3,
      mainPhoto: product.thumbnailUrl || "",
      otherPhotos: (product as any).photos?.others || product.gallery || [],
      infographicsMain: (product as any).infographics?.main || "",
      infographicsOther: (product as any).infographics?.others || [],
      colors: (product as any).colors || [],
      status: product.status || "inactive",
      supplierId: ((product as any).customFields && (product as any).customFields.supplierId) || "",
      supplierSku: ((product as any).customFields && (product as any).customFields.supplierSku) || "",
    } as any)
    const initialColors: ColorItem[] = ((product as any)?.colors || []).map((c: any) => ({
      id: c.id || crypto.randomUUID(),
      nameEn: c.nameEn || "",
      mainImage: c.mainImage || "",
    }))
    setColors(initialColors)
    initialized.current = true
  }, [open, product, prefillFrom, categories, form])

  // Upload zones
  const mainDz = useDropzone({
    multiple: false,
    accept: { "image/*": [] },
    maxSize: 15 * 1024 * 1024,
    onDropAccepted: (files) => {
      const f = files[0]
      const r = new FileReader()
      r.onload = () => form.setValue("mainPhoto", String(r.result), { shouldDirty: true, shouldValidate: true })
      r.readAsDataURL(f)
    },
  })
  const otherDz = useDropzone({
    multiple: true,
    accept: { "image/*": [] },
    maxSize: 15 * 1024 * 1024,
    onDropAccepted: async (files) => {
      const urls = await Promise.all(
        files.map(
          (f) =>
            new Promise<string>((resolve) => {
              const r = new FileReader()
              r.onload = () => resolve(String(r.result))
              r.readAsDataURL(f)
            }),
        ),
      )
      const current = form.getValues("otherPhotos") || []
      form.setValue("otherPhotos", [...current, ...urls], { shouldDirty: true, shouldValidate: true })
    },
  })
  const infoOtherDz = useDropzone({
    multiple: true,
    accept: { "image/*": [] },
    maxSize: 15 * 1024 * 1024,
    onDropAccepted: async (files) => {
      const urls = await Promise.all(
        files.map(
          (f) =>
            new Promise<string>((resolve) => {
              const r = new FileReader()
              r.onload = () => resolve(String(r.result))
              r.readAsDataURL(f)
            }),
        ),
      )
      const current = form.getValues("infographicsOther") || []
      form.setValue("infographicsOther", [...current, ...urls], { shouldDirty: true, shouldValidate: true })
    },
  })

  const mut = useMutation({
    mutationFn: async (values: FormValues) => {
      if (colors.some((c) => !c.nameEn.trim())) {
        throw new Error("Fill Color name (EN)")
      }
      if (!values.supplierId) {
        throw new Error("Select Supplier")
      }
      const method = values.id ? "PUT" : "POST"
      const url = values.id ? `/api/products/${values.id}` : "/api/products"

      const payload: any = {
        name: values.name,
        category: values.category,
        sub: values.sub,
        description: values.technicalDescription,
        technicalDescription: values.technicalDescription,
        sizes: (values.sizes || []).filter(Boolean),
        thickness: (values.thickness || []).filter(Boolean),
        pcsPerBox: Number.isFinite(values.pcsPerBox) ? values.pcsPerBox : 0,
        boxKg: Number.isFinite(values.boxKg) ? values.boxKg : 0,
        boxM3: Number.isFinite(values.boxM3) ? values.boxM3 : 0,
        minOrderBoxes: 1,
        thumbnailUrl: values.mainPhoto,
        photos: { main: values.mainPhoto, others: values.otherPhotos || [] },
        infographics: { main: values.infographicsMain, others: values.infographicsOther || [] },
        colors,
        status: "inactive",
        customFields: {
          ...(product as any)?.customFields,
          supplierId: values.supplierId,
          supplierSku: values.supplierSku || "",
        },
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        let msg = "Save failed"
        try {
          const err = await res.json()
          msg = err?.error || msg
        } catch {}
        throw new Error(msg)
      }
      return (await res.json()) as Product
    },
    onSuccess: (created) => {
      const sku = created?.sku || "product"
      toast({ title: "Saved", description: `Product ${sku} saved as Inactive.` })
      qc.invalidateQueries({ queryKey: ["products"] })
      qc.invalidateQueries({ queryKey: ["products-catalog"] })
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("products:changed", { detail: { id: created.id } }))
      }
      onOpenChange(false)
      initialized.current = false
    },
    onError: (e: any) => {
      toast({ title: "Error", description: String(e.message || e), variant: "destructive" })
    },
  })

  const [previewOpen, setPreviewOpen] = React.useState(false)

  function FieldError({ name }: { name: keyof FormValues }) {
    const err = (form.formState.errors as any)[name]
    if (!err) return null
    return <p className="mt-1 text-xs text-red-600">{err.message as string}</p>
  }

  function ChipsField({
    name,
    placeholder,
    label,
  }: { name: "sizes" | "thickness"; placeholder: string; label: string }) {
    const vals = form.watch(name) as string[]
    const add = (v: string) => {
      const val = v.trim()
      if (!val) return
      const next = Array.from(new Set([...(vals || []), val]))
      form.setValue(name, next as any, { shouldDirty: true, shouldValidate: true })
    }
    const removeChip = (v: string) =>
      form.setValue(name, (vals || []).filter((x) => x !== v) as any, { shouldDirty: true, shouldValidate: true })

    return (
      <div>
        <Label className="text-sm">{label}</Label>
        <div className="mb-1 mt-1 flex flex-wrap gap-1.5">
          {(vals || []).map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px]">
              {v}
              <button type="button" onClick={() => removeChip(v)} aria-label={`Remove ${v}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <Input
          placeholder={placeholder}
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              const val = (e.target as HTMLInputElement).value
              add(val)
              ;(e.target as HTMLInputElement).value = ""
            }
          }}
        />
      </div>
    )
  }

  const ColorRow = React.memo(function ColorRow({
    color,
    onChange,
    onRemove,
  }: {
    color: ColorItem
    onChange: (patch: Partial<ColorItem>) => void
    onRemove: () => void
  }) {
    const commitName = () => {
      const trimmed = (color.nameEn || "").trim()
      if (trimmed !== color.nameEn) {
        onChange({ nameEn: trimmed })
      }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const r = new FileReader()
      r.onload = () => onChange({ mainImage: String(r.result) })
      r.readAsDataURL(file)
    }

    return (
      <div className="rounded border p-2">
        <div className="grid items-center gap-2 md:grid-cols-[140px_1fr_auto]">
          <div className="flex items-center justify-center">
            <div className="relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded border border-dashed h-16 w-40">
              <input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {color.mainImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={color.mainImage || "/placeholder.svg"}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                  <button
                    type="button"
                    aria-label="Remove color image"
                    onClick={() => onChange({ mainImage: "" })}
                    className="absolute right-1 top-1 rounded border bg-background/80 p-0.5 text-muted-foreground hover:text-foreground z-20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Drop/select</span>
              )}
            </div>
          </div>

          <div className="grid gap-1">
            <Label className="text-xs">{"Color name (EN)"}</Label>
            <Input
              value={color.nameEn}
              onChange={(e) => onChange({ nameEn: e.target.value })}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commitName()
                }
              }}
              placeholder="e.g., White"
              className="h-8 text-sm"
              autoComplete="off"
            />
          </div>

          <div className="flex items-end justify-end">
            <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={onRemove}>
              <Trash2 className="mr-1 h-3 w-3" />
              {"Remove"}
            </Button>
          </div>
        </div>
      </div>
    )
  })

  const selectedCat = categories.find((c) => c.slug === form.watch("category"))
  const subs = selectedCat?.subs ?? []

  const draftProduct: Product = {
    id: form.getValues("id") || "draft",
    sku: "DRAFT",
    name: form.watch("name") || "New Product",
    description: form.watch("technicalDescription"),
    category: form.watch("category") || "Category",
    sub: form.watch("sub") || "Sub",
    thickness: form.watch("thickness") || [],
    sizes: form.watch("sizes") || [],
    pcsPerBox: form.watch("pcsPerBox") || 0,
    boxKg: form.watch("boxKg") || 0,
    boxM3: form.watch("boxM3") || 0,
    minOrderBoxes: 1,
    status: "inactive",
    tags: [],
    customFields: {
      supplierId: form.watch("supplierId"),
      supplierSku: form.watch("supplierSku"),
    } as any,
    thumbnailUrl: form.watch("mainPhoto") || undefined,
    gallery: form.watch("otherPhotos") || [],
    stockLevel: 0,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    technicalDescription: form.watch("technicalDescription"),
    photos: { main: form.watch("mainPhoto"), others: form.watch("otherPhotos") } as any,
    infographics: { main: form.watch("infographicsMain"), others: form.watch("infographicsOther") } as any,
    colors: colors as unknown as Product["colors"],
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) initialized.current = false
      }}
    >
      <DialogContent className="max-w-[95vw] md:max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-y-auto p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">
            {product ? "Edit Product" : prefillFrom ? "Duplicate Product" : "New Product"}
          </DialogTitle>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(() => {
            form.setValue("colors", colors as any, { shouldDirty: true })
            mut.mutate(form.getValues())
          })}
        >
          {/* Row 1: Name / Category / Sub */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-1">
              <Label className="text-sm">Name</Label>
              <Input {...form.register("name")} className="h-8 text-sm" required />
              <FieldError name="name" />
            </div>
            <div className="grid gap-1">
              <Label className="text-sm">Category</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(v) => {
                  form.setValue("category", v, { shouldDirty: true, shouldValidate: true })
                  const first = (categories.find((c) => c.slug === v)?.subs ?? [])[0]?.name || ""
                  form.setValue("sub", first, { shouldDirty: true, shouldValidate: true })
                }}
              >
                <SelectTrigger className="h-8 text-sm">
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
              <FieldError name="category" />
            </div>
            <div className="grid gap-1">
              <Label className="text-sm">Subcategory</Label>
              <Select
                value={form.watch("sub")}
                onValueChange={(v) => form.setValue("sub", v, { shouldDirty: true, shouldValidate: true })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select Sub" />
                </SelectTrigger>
                <SelectContent>
                  {(subs.length ? subs.map((s) => s.name) : []).map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError name="sub" />
            </div>
          </div>

          {/* Row 2: Pcs/Box, KG, m3, Sizes, Thickness */}
          <div className="grid gap-3 lg:grid-cols-5 md:grid-cols-3">
            <div className="grid gap-1">
              <Label className="text-sm">Pcs/Box</Label>
              <Input
                type="number"
                {...form.register("pcsPerBox", { valueAsNumber: true })}
                min={1}
                className="h-8 text-sm"
              />
              <FieldError name="pcsPerBox" />
            </div>
            <div className="grid gap-1">
              <Label className="text-sm">Box KG</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register("boxKg", { valueAsNumber: true })}
                min={0.01}
                className="h-8 text-sm"
              />
              <FieldError name="boxKg" />
            </div>
            <div className="grid gap-1">
              <Label className="text-sm">Box m³</Label>
              <Input
                type="number"
                step="0.001"
                {...form.register("boxM3", { valueAsNumber: true })}
                min={0.001}
                className="h-8 text-sm"
              />
              <FieldError name="boxM3" />
            </div>
            <div className="grid gap-1">
              <ChipsField name="sizes" placeholder="e.g., 60×60cm (Enter)" label="Sizes" />
              <FieldError name="sizes" />
            </div>
            <div className="grid gap-1">
              <ChipsField name="thickness" placeholder="e.g., 2 mm (Enter)" label="Thickness" />
              <FieldError name="thickness" />
            </div>
          </div>

          {/* Supply: required Supplier selection */}
          <Card>
            <CardContent className="grid gap-3 p-3 md:grid-cols-3">
              <div className="grid gap-1">
                <Label className="text-sm">Supplier</Label>
                <Select
                  value={form.watch("supplierId")}
                  onValueChange={(v) => form.setValue("supplierId", v, { shouldDirty: true, shouldValidate: true })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.shortName} — {s.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError name="supplierId" />
              </div>
              <div className="grid gap-1 md:col-span-2">
                <Label className="text-sm">Supplier SKU (optional)</Label>
                <Input
                  value={form.watch("supplierSku") || ""}
                  onChange={(e) => form.setValue("supplierSku", e.target.value, { shouldDirty: true })}
                  placeholder="Supplier's code for this item"
                  className="h-8 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardContent className="space-y-2 p-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Colors</Label>
                <Button type="button" size="sm" variant="outline" onClick={addColor}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Color
                </Button>
              </div>
              {colors.length === 0 ? (
                <div className="text-xs text-muted-foreground">No colors yet. Add at least one color.</div>
              ) : null}
              <div className="space-y-2">
                {colors.map((c) => (
                  <ColorRow
                    key={c.id}
                    color={c}
                    onChange={(patch) => patchColor(c.id, patch)}
                    onRemove={() => removeColor(c.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardContent className="grid gap-3 p-3 md:grid-cols-2">
              <div className="grid gap-1">
                <Label className="text-sm">Main Photo (required)</Label>
                <div
                  {...mainDz.getRootProps()}
                  className={cn(
                    "relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded border border-dashed",
                    "h-16 w-40",
                  )}
                >
                  <input {...mainDz.getInputProps()} />
                  {form.watch("mainPhoto") ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.watch("mainPhoto") || "/placeholder.svg"}
                        alt=""
                        className="h-full w-full object-contain p-1"
                      />
                      <button
                        type="button"
                        aria-label="Remove main photo"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          form.setValue("mainPhoto", "", { shouldDirty: true, shouldValidate: true })
                        }}
                        className="absolute right-1 top-1 rounded border bg-background/80 p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Drop/select</span>
                  )}
                </div>
                <FieldError name="mainPhoto" />
              </div>

              <div className="grid gap-1">
                <Label className="text-sm">Other Photos (optional)</Label>
                <div
                  {...otherDz.getRootProps()}
                  className={cn(
                    "flex h-14 w-40 cursor-pointer items-center justify-center rounded border border-dashed",
                  )}
                >
                  <input {...otherDz.getInputProps()} />
                  <span className="text-xs text-muted-foreground">Drop/select multiple</span>
                </div>
                {(form.watch("otherPhotos") || []).length ? (
                  <div className="mt-1 grid grid-cols-6 gap-2">
                    {(form.watch("otherPhotos") || []).map((src, i) => (
                      <div key={i} className="relative overflow-hidden rounded border bg-muted/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src || "/placeholder.svg"} alt="" className="h-14 w-20 object-contain p-1" />
                        <button
                          type="button"
                          aria-label="Remove photo"
                          onClick={() => {
                            const rest = (form.getValues("otherPhotos") || []).filter((_, idx) => idx !== i)
                            form.setValue("otherPhotos", rest, { shouldDirty: true, shouldValidate: true })
                          }}
                          className="absolute right-1 top-1 rounded border bg-background/80 p-0.5 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Infographics */}
          <Card>
            <CardContent className="grid gap-3 p-3 md:grid-cols-2">
              <div className="grid gap-1">
                <Label className="text-sm">Infographics Main Photo (required)</Label>
                <div
                  className={cn(
                    "relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded border border-dashed",
                    "h-16 w-40",
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const r = new FileReader()
                        r.onload = () =>
                          form.setValue("infographicsMain", String(r.result), {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        r.readAsDataURL(file)
                      }
                    }}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                  />
                  {form.watch("infographicsMain") ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.watch("infographicsMain") || "/placeholder.svg"}
                        alt=""
                        className="h-full w-full object-contain p-1"
                      />
                      <button
                        type="button"
                        aria-label="Remove infographics main"
                        onClick={() => {
                          form.setValue("infographicsMain", "", { shouldDirty: true, shouldValidate: true })
                        }}
                        className="absolute right-1 top-1 rounded border bg-background/80 p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Drop/select</span>
                  )}
                </div>
                <FieldError name="infographicsMain" />
              </div>

              <div className="grid gap-1">
                <Label className="text-sm">Infographics Other (optional)</Label>
                <div
                  className={cn(
                    "flex h-14 w-40 cursor-pointer items-center justify-center rounded border border-dashed",
                  )}
                >
                  <input {...infoOtherDz.getInputProps()} />
                  <span className="text-xs text-muted-foreground">Drop/select multiple</span>
                </div>
                {(form.watch("infographicsOther") || []).length ? (
                  <div className="mt-1 grid grid-cols-6 gap-2">
                    {(form.watch("infographicsOther") || []).map((src, i) => (
                      <div key={i} className="relative overflow-hidden rounded border bg-muted/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src || "/placeholder.svg"} alt="" className="h-14 w-20 object-contain p-1" />
                        <button
                          type="button"
                          aria-label="Remove infographics image"
                          onClick={() => {
                            const rest = (form.getValues("infographicsOther") || []).filter((_, idx) => idx !== i)
                            form.setValue("infographicsOther", rest, { shouldDirty: true, shouldValidate: true })
                          }}
                          className="absolute right-1 top-1 rounded border bg-background/80 p-0.5 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Technical Description */}
          <div className="grid gap-1">
            <Label className="text-sm">Technical Description</Label>
            <Textarea rows={3} {...form.register("technicalDescription")} className="text-sm" required />
            <FieldError name="technicalDescription" />
          </div>

          {/* Footer: Cancel — Preview — Save */}
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" className="h-8 bg-transparent" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-8"
              onClick={() => setPreviewOpen(true)}
              title="Preview"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button type="submit" disabled={!form.formState.isValid || mut.isPending} className="h-8">
              {mut.isPending ? "Saving..." : prefillFrom ? "Create Copy" : "Save (Inactive)"}
            </Button>
          </div>
        </form>

        {/* Full-page Preview */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-[98vw] lg:max-w-[1400px] h-[90vh] p-4 overflow-y-auto">
            <ProductDetails product={draftProduct} />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}

export default ExtendedProductForm
