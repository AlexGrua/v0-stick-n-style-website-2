"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import type { Category, Product } from "@/lib/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Upload, Camera } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { uploadImage } from "@/lib/image-upload"
import { Form } from "@/components/ui/form"

type ColorItem = {
  id: string
  name: string
  image?: string
}

type InteriorApplication = {
  id: string
  title: string
  description: string
  image: string
}

type SpecificationItem = {
  id: string
  name: string
  icon?: string
}

type SupplierLite = {
  id: string
  shortName: string
  companyName: string
}

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  sub: z.string().optional(),
  description: z.string().default(""),
  sizes: z.array(z.string()).default([]),
  thickness: z.array(z.string()).default([]),
  pcsPerBox: z.coerce.number().int().min(1).optional(),
  boxKg: z.coerce.number().min(0.01).optional(),
  boxM3: z.coerce.number().min(0.001).optional(),
  mainPhoto: z.string().min(1, "Main photo is required"),
  otherPhotos: z.array(z.string()).default([]),
  colors: z.array(z.any()).default([]),
  status: z.enum(["active", "inactive", "discontinued"]).default("inactive"),
  supplierId: z.string().min(1, "Supplier is required"),
  technicalSpecifications: z.array(z.any()).default([]),
  colorVariants: z.array(z.any()).default([]),
  productSpecifications: z.array(z.any()).default([
    { name: "Material", value: "", icon: "" },
    { name: "Usage", value: "", icon: "" },
    { name: "Application", value: "", icon: "" },
    { name: "Adhesion", value: "", icon: "" },
    { name: "Physical Properties", value: "", icon: "" },
    { name: "Suitable Surfaces", value: "", icon: "" },
  ]),
  interiorApplications: z.array(z.any()).default([]),
  installationNotes: z.string().default(""),
})

type FormValues = z.infer<typeof productSchema>
type CatResponse = { items: Category[] }
type SupResponse = { items: SupplierLite[] }

async function fetchCategories() {
  const res = await fetch("/api/categories")
  if (!res.ok) throw new Error("Failed to load categories")
  return (await res.json()) as CatResponse
}

async function fetchSuppliers() {
  console.log("[v0] Fetching suppliers for product form")
  const res = await fetch("/api/suppliers")
  if (!res.ok) throw new Error("Failed to load suppliers")
  const data = (await res.json()) as { items: any[] }
  console.log("[v0] Raw suppliers data:", data)

  const items: SupplierLite[] = (data.items || []).map((s: any) => ({
    id: s.id,
    shortName: s.name || s.short_name || s.shortName, // API returns 'name' field
    companyName: s.name || s.company_name || s.companyName, // Use name as company name fallback
  }))
  console.log("[v0] Mapped suppliers:", items)
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
  const categoriesData = catData?.items ?? []
  const [categories, setCategories] = useState(categoriesData)
  const { data: supData } = useQuery({ queryKey: ["suppliers-lite"], queryFn: fetchSuppliers })
  const suppliers = supData?.items ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      category: product?.category_id?.toString() || "",
      sub: product?.specifications?.sub || product?.sub || "",
      description: product?.description || "",
      sizes: Array.isArray(product?.sizes) ? product.sizes : [],
      thickness: Array.isArray(product?.thickness) ? product.thickness : [],
      pcsPerBox: product?.pcsPerBox || product?.pcs_per_box || 1,
      boxKg: product?.boxKg || product?.box_kg || 0.1,
      boxM3: product?.boxM3 || product?.box_m3 || 0.001,
      mainPhoto: product?.image_url || "",
      otherPhotos: Array.isArray(product?.images) ? product.images : [],
      colors: Array.isArray(product?.colors) ? product.colors : [],
      status: (product?.status as "active" | "inactive" | "discontinued") || "inactive",
      supplierId: product?.supplierId?.toString() || product?.supplier_id?.toString() || "",
      installationNotes: product?.installationNotes || product?.installation_notes || "",
      colorVariants: Array.isArray(product?.colorVariants) ? product.colorVariants : [],
      technicalSpecifications: Array.isArray(product?.technicalSpecifications) ? product.technicalSpecifications : [],
      productSpecifications: Array.isArray((product as any)?.productSpecifications)
        ? (product as any).productSpecifications
        : [],
    },
    mode: "onChange",
    shouldUnregister: false,
  })

  const [colorVariants, setColorVariants] = React.useState<ColorItem[]>([])
  const [interiorApplications, setInteriorApplications] = React.useState<InteriorApplication[]>([])
  const [materialSpecs, setMaterialSpecs] = React.useState<SpecificationItem[]>([])
  const [usageSpecs, setUsageSpecs] = React.useState<SpecificationItem[]>([])
  const [applicationSpecs, setApplicationSpecs] = React.useState<SpecificationItem[]>([])
  const [adhesionSpecs, setAdhesionSpecs] = React.useState<SpecificationItem[]>([])
  const [physicalProps, setPhysicalProps] = React.useState<SpecificationItem[]>([])
  const [suitableSurfaces, setSuitableSurfaces] = React.useState<SpecificationItem[]>([])

  // Colors state (existing)
  const [colors, setColors] = React.useState<ColorItem[]>([])
  const addColor = () => setColors((prev) => [...prev, { id: crypto.randomUUID(), name: "", image: "" }])
  const removeColor = (id: string) => setColors((prev) => prev.filter((c) => c.id !== id))
  const patchColor = (id: string, patch: Partial<ColorItem>) => {
    setColors((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  const addSpecItem = (setter: React.Dispatch<React.SetStateAction<SpecificationItem[]>>) => {
    setter((prev) => [...prev, { id: crypto.randomUUID(), name: "", icon: "" }])
  }

  const removeSpecItem = (id: string, setter: React.Dispatch<React.SetStateAction<SpecificationItem[]>>) => {
    setter((prev) => prev.filter((item) => item.id !== id))
  }

  const updateSpecItem = (
    id: string,
    patch: Partial<SpecificationItem>,
    setter: React.Dispatch<React.SetStateAction<SpecificationItem[]>>,
  ) => {
    setter((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const addInteriorApp = () => {
    setInteriorApplications((prev) => [...prev, { id: crypto.randomUUID(), title: "", description: "", image: "" }])
  }

  const removeInteriorApp = (id: string) => {
    setInteriorApplications((prev) => prev.filter((app) => app.id !== id))
  }

  const updateInteriorApp = (id: string, patch: Partial<InteriorApplication>) => {
    setInteriorApplications((prev) => prev.map((app) => (app.id === id ? { ...app, ...patch } : app)))
  }

  const initialized = React.useRef(false)

  const [validationMessage, setValidationMessage] = useState("")

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories")
        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Categories loaded:", data)
          setCategories(data.items || [])
        }
      } catch (error) {
        console.error("[v0] Error loading categories:", error)
      }
    }
    fetchCategories()
  }, [])

  React.useEffect(() => {
    if (!open) {
      initialized.current = false
      return
    }
    if (initialized.current) return
    if (categories.length === 0) return

    console.log("[v0] Initializing product form", {
      product: !!product,
      prefillFrom: !!prefillFrom,
      categoriesCount: categories.length,
    })

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
        boxM3: 0.2,
        mainPhoto: p.thumbnailUrl || "",
        otherPhotos: [],
        infographicsMain: p.infographics?.main || "",
        infographicsOther: p.infographics?.others || [],
        colors: [],
        status: "inactive",
        supplierId: (p.customFields && p.customFields.supplierId) || "",
        supplierSku: (p.customFields && p.customFields.supplierSku) || "",
        // Initialize new fields from prefill
        colorVariants: p.color_variants || [],
        interiorApplications: p.interior_applications || [],
        technicalSpecifications: p.technical_specifications || {},
        installationNotes: p.installation_notes || "",
        material: p.material || [],
        usage: p.usage || [],
        application: p.application || [],
        adhesion: p.adhesion || [],
        physicalProperties: p.physical_properties || [],
        suitableSurfaces: p.suitable_surfaces || [],
        images: [],
        productSpecifications: (product as any).productSpecifications || [],
      } as any)

      // Initialize state arrays
      setColorVariants(p.color_variants || [])
      setInteriorApplications(p.interior_applications || [])
      setMaterialSpecs(p.material || [])
      setUsageSpecs(p.usage || [])
      setApplicationSpecs(p.application || [])
      setAdhesionSpecs(p.adhesion || [])
      setPhysicalProps(p.physical_properties || [])
      setSuitableSurfaces(p.suitable_surfaces || [])

      const initialColors: ColorItem[] = (p?.colors || []).map((c: any) => ({
        id: c.id || crypto.randomUUID(),
        name: c.nameEn || c.name || "",
        image: c.mainImage || c.image || "",
      }))
      setColors(initialColors)
      initialized.current = true
      return
    }

    if (!product) {
      const firstCat = categories[0]
      form.reset({
        name: "",
        category: firstCat?.id.toString() || "",
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
        // Initialize new fields with defaults
        colorVariants: [],
        interiorApplications: [],
        technicalSpecifications: {
          size: "",
          thickness: "",
          pieces_per_box: "",
          box_size: "",
          weight: "",
          volume: "",
        },
        installationNotes: "",
        material: [],
        usage: [],
        application: [],
        adhesion: [],
        physicalProperties: [],
        suitableSurfaces: [],
        images: [],
        productSpecifications: [],
      } as any)

      // Reset all state arrays
      setColors([])
      setColorVariants([])
      setInteriorApplications([])
      setMaterialSpecs([])
      setUsageSpecs([])
      setApplicationSpecs([])
      setAdhesionSpecs([])
      setPhysicalProps([])
      setSuitableSurfaces([])
      initialized.current = true
      return
    }
  }, [product, prefillFrom, open, categories, form])

  React.useEffect(() => {
    if (product) {
      console.log("[v0] Editing product data:", product)
      console.log("[v0] Product specifications:", product.specifications)
      console.log("[v0] Product supplierId:", product.supplierId)
      console.log("[v0] Product technicalSpecifications:", product.technicalSpecifications)

      const specs = product.specifications || {}

      form.reset({
        name: product.name || "",
        category: product.category_id?.toString() || "",
        sub: specs.sub || product.sub || "",
        description: product.description || "",
        sizes: Array.isArray(product.sizes) ? product.sizes : [],
        thickness: Array.isArray(product.thickness) ? product.thickness : [],
        pcsPerBox: specs.pcsPerBox || product.pcsPerBox || 1,
        boxKg: specs.boxKg || product.boxKg || 0.1,
        boxM3: specs.boxM3 || product.boxM3 || 0.001,
        mainPhoto: product.image_url || "",
        otherPhotos: Array.isArray(product.images) ? product.images : [],
        colors: Array.isArray(product.colors) ? product.colors : [],
        status: product.status || "inactive",
        supplierId: product.supplierId?.toString() || specs.supplierId?.toString() || "",
        installationNotes: specs.installationNotes || product.installationNotes || "",
        colorVariants: specs.colorVariants || product.colorVariants || [],
        technicalSpecifications: specs.technicalSpecifications || product.technicalSpecifications || [],
        productSpecifications: specs.productSpecifications || (product as any).productSpecifications || [],
      } as any)

      console.log("[v0] Form reset with values:", {
        supplierId: product.supplierId?.toString() || specs.supplierId?.toString() || "",
        techSpecs: (specs.technicalSpecifications || product.technicalSpecifications || []).length,
      })

      setColorVariants(specs.colorVariants || product.colorVariants || [])
      setInteriorApplications(specs.interiorApplications || product.interiorApplications || [])
      setMaterialSpecs(specs.material || product.material || [])
      setUsageSpecs(specs.usage || product.usage || [])
      setApplicationSpecs(specs.application || product.application || [])
      setAdhesionSpecs(product.adhesion || [])
      setPhysicalProps(product.physicalProperties || [])
      setSuitableSurfaces(product.suitableSurfaces || [])
    }
  }, [product, form])

  const uploadImageAsBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const mainDz = useDropzone({
    multiple: false,
    accept: { "image/*": [] },
    maxSize: 15 * 1024 * 1024,
    onDropAccepted: async (files) => {
      const f = files[0]
      try {
        console.log("[v0] Uploading main photo:", f.name)
        const base64Url = await uploadImageAsBase64(f)
        form.setValue("mainPhoto", base64Url, { shouldDirty: true, shouldValidate: true })
        console.log("[v0] Main photo uploaded successfully")
      } catch (error) {
        console.error("[v0] Main photo upload failed:", error)
      }
    },
  })

  const otherDz = useDropzone({
    multiple: true,
    accept: { "image/*": [] },
    maxSize: 15 * 1024 * 1024,
    onDropAccepted: async (files) => {
      try {
        console.log("[v0] Uploading other photos:", files.length)
        const urls = await Promise.all(files.map((f) => uploadImageAsBase64(f)))
        const current = form.getValues("otherPhotos") || []
        form.setValue("otherPhotos", [...current, ...urls], { shouldDirty: true, shouldValidate: true })
        console.log("[v0] Other photos uploaded successfully")
      } catch (error) {
        console.error("[v0] Other photos upload failed:", error)
      }
    },
  })

  const infoOtherDz = useDropzone({
    multiple: true,
    accept: { "image/*": [] },
    maxSize: 15 * 1024 * 1024,
    onDropAccepted: async (files) => {
      try {
        console.log("[v0] Uploading infographics:", files.length)
        const urls = await Promise.all(files.map((f) => uploadImage(f)))
        const current = form.getValues("infographicsOther") || []
        form.setValue("infographicsOther", [...current, ...urls], { shouldDirty: true, shouldValidate: true })
        console.log("[v0] Infographics uploaded successfully")
      } catch (error) {
        console.error("[v0] Infographics upload failed:", error)
      }
    },
  })

  const mut = useMutation({
    mutationFn: async (values: FormValues) => {
      console.log("[v0] Starting product save with values:", values)
      console.log("[v0] Form validation check:", {
        name: !!values.name,
        category: !!values.category,
        supplierId: !!values.supplierId,
        mainPhoto: !!values.mainPhoto,
        colorsCount: colors.length,
        techSpecs: values.technicalSpecifications?.length || 0,
      })

      if (!values.name?.trim()) {
        console.log("[v0] Validation failed: Product name is required")
        throw new Error("Product name is required")
      }

      if (!values.category) {
        console.log("[v0] Validation failed: Category is required")
        throw new Error("Please select a category")
      }

      if (!values.supplierId) {
        console.log("[v0] Validation failed: Supplier is required")
        throw new Error("Please select a supplier")
      }

      if (!values.mainPhoto) {
        console.log("[v0] Validation failed: Main photo is required")
        throw new Error("Please upload a main photo")
      }

      if (values.colorVariants && values.colorVariants.some((c: any) => !c.name?.trim())) {
        console.log("[v0] Validation failed: Color names are required")
        throw new Error("Please fill in all color names")
      }

      const method = values.id ? "PUT" : "POST"
      const url = values.id ? `/api/products/${values.id}` : "/api/products"

      const payload: any = {
        name: values.name,
        category_id: Number.parseInt(values.category),
        description: values.description || "",
        price: 0,
        image_url: values.mainPhoto || "",
        images: values.otherPhotos || [],
        in_stock: true,
        specifications: {
          sub: values.sub || "",
          description: values.description || "",
          sizes: (values.sizes || []).filter(Boolean),
          thickness: (values.thickness || []).filter(Boolean),
          pcsPerBox: Number.isFinite(values.pcsPerBox) ? values.pcsPerBox : 0,
          boxKg: Number.isFinite(values.boxKg) ? values.boxKg : 0,
          boxM3: Number.isFinite(values.boxM3) ? values.boxM3 : 0,
          minOrderBoxes: 1,
          supplierId: values.supplierId,
          supplierSku: values.supplierSku || "",
          technicalSpecifications: values.technicalSpecifications || [],
          colorVariants: values.colorVariants || [],
          productSpecifications: values.productSpecifications || [],
          interiorApplications: values.interiorApplications || [],
          installationNotes: values.installationNotes || "",
        },
      }

      console.log("[v0] Request payload:", payload)

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
      const result = await res.json()
      console.log("[v0] Product saved successfully:", result)
      return result as Product
    },
    onSuccess: (created) => {
      const sku = created?.sku || "product"
      toast({ title: "Saved", description: `Product ${sku} saved successfully.` })
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

  const [isFormValid, setIsFormValid] = React.useState(false)
  const formValues = form.watch()
  const formValuesRef = React.useRef(formValues)
  formValuesRef.current = formValues

  const [newSize, setNewSize] = React.useState("")
  const [newThickness, setNewThickness] = React.useState("")
  const [newBoxSize, setNewBoxSize] = React.useState("")
  const [newBoxVolume, setNewBoxVolume] = React.useState(0)
  const [newBoxWeight, setNewBoxWeight] = React.useState(0)
  const [newPcsPerBox, setNewPcsPerBox] = React.useState(0)

  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null)

  React.useEffect(() => {
    if (Array.isArray(categories) && form.watch("category")) {
      const foundCategory = categories.find((cat) => cat.id.toString() === form.watch("category"))
      setSelectedCategory(foundCategory || null)
    }
  }, [categories, form.watch("category")])

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

  const onCancel = () => {
    onOpenChange(false)
  }

  const [activeTab, setActiveTab] = useState("basic")

  const saveColors = () => {
    console.log("[v0] Save Colors clicked")
    const currentColors = form.watch("colorVariants") || []
    console.log("[v0] Current colors to save:", currentColors)

    // Валидация цветов
    const invalidColors = currentColors.filter((color) => !color.name.trim())
    if (invalidColors.length > 0) {
      toast({
        title: "Error",
        description: "Please fill in all color names before saving.",
        variant: "destructive",
      })
      return
    }

    // Обновляем форму с текущими цветами
    form.setValue("colorVariants", currentColors)
    toast({
      title: "Colors Saved",
      description: `${currentColors.length} colors saved to product.`,
    })
  }

  const handleSubmit = form.handleSubmit((formValues) => {
    console.log("[v0] Save Product clicked - form values:", formValues)
    console.log("[v0] Form validation state:", form.formState.isValid)
    console.log("[v0] Form errors:", form.formState.errors)

    if (!formValues.name?.trim()) {
      console.log("[v0] Validation failed: name is required")
      toast({ title: "Error", description: "Product name is required", variant: "destructive" })
      return
    }

    if (!formValues.category) {
      console.log("[v0] Validation failed: category is required")
      toast({ title: "Error", description: "Category is required", variant: "destructive" })
      return
    }

    if (!formValues.supplierId) {
      console.log("[v0] Validation failed: supplier is required")
      toast({ title: "Error", description: "Supplier is required", variant: "destructive" })
      return
    }

    const submitData = {
      ...formValues,
      id: product?.id, // Устанавливаем ID для режима редактирования
      technicalSpecifications: formValues.technicalSpecifications || [],
      colorVariants: formValues.colorVariants || [],
      interiorApplications: formValues.interiorApplications || [],
      productSpecifications: formValues.productSpecifications || [],
    }

    console.log(
      "[v0] Submit data with ID:",
      submitData.id ? `Editing product ${submitData.id}` : "Creating new product",
    )
    console.log("[v0] Full submit data:", submitData)
    mut.mutate(submitData)
  })

  const FieldError = ({ name }: { name: string }) => {
    const message = form.formState.errors[name]?.message?.toString()
    if (!message) return null
    return <div className="text-sm text-destructive mt-1">{message}</div>
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

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex space-x-1 border-b">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === "basic"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Basic Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("specifications")}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === "specifications"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Specifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("applications")}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === "applications"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Applications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("technical")}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === "technical"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Technical
              </button>
            </div>

            {/* Basic Information Tab */}
            {activeTab === "basic" && (
              <Card className="p-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input id="name" {...form.register("name")} placeholder="Enter product name" />
                      <FieldError name="name" />
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={form.watch("category")}
                        onValueChange={(value) => {
                          form.setValue("category", value, { shouldDirty: true })
                          form.setValue("sub", "", { shouldDirty: true })
                          const category = categories.find((c) => c.id.toString() === value)
                          setSelectedCategory(category || null)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError name="category" />
                    </div>

                    <div>
                      <Label htmlFor="sub">Subcategory</Label>
                      <Select
                        value={form.watch("sub") || ""}
                        onValueChange={(value) => {
                          form.setValue("sub", value, { shouldDirty: true })
                        }}
                        disabled={!selectedCategory?.subs?.length}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCategory?.subs?.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError name="sub" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Product Description</Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
                      placeholder="Enter detailed product description..."
                      className="mt-1 min-h-[100px]"
                    />
                    <FieldError name="description" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Main Photo (required)</Label>
                      <div className="mt-2">
                        {form.watch("mainPhoto") ? (
                          <div className="relative">
                            <img
                              src={form.watch("mainPhoto") || "/placeholder.svg"}
                              alt="Main"
                              className="w-full h-32 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1"
                              onClick={() => form.setValue("mainPhoto", "")}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 h-32 flex items-center justify-center"
                            onClick={() => document.getElementById("main-photo-input")?.click()}
                          >
                            <div>
                              <Upload className="mx-auto h-8 w-8 text-gray-400" />
                              <p className="mt-1 text-sm text-gray-600">Click to upload main photo</p>
                            </div>
                          </div>
                        )}
                        <input
                          id="main-photo-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                form.setValue("mainPhoto", e.target?.result as string)
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                      </div>
                      <FieldError name="mainPhoto" />
                    </div>

                    <div>
                      <Label>Additional Photos (up to 10)</Label>
                      <div className="mt-2 space-y-2">
                        {form.watch("otherPhotos")?.length > 0 && (
                          <div className="grid grid-cols-5 gap-2 mb-2">
                            {form.watch("otherPhotos").map((photo, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={photo || "/placeholder.svg"}
                                  alt={`Additional ${index + 1}`}
                                  className="w-full h-16 object-cover rounded border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
                                  onClick={() => {
                                    const current = form.watch("otherPhotos") || []
                                    form.setValue(
                                      "otherPhotos",
                                      current.filter((_, i) => i !== index),
                                    )
                                  }}
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        {(form.watch("otherPhotos")?.length || 0) < 10 && (
                          <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-gray-400 h-16 flex items-center justify-center"
                            onClick={() => document.getElementById("additional-photos-input")?.click()}
                          >
                            <div>
                              <Plus className="mx-auto h-4 w-4 text-gray-400" />
                              <p className="text-xs text-gray-600">
                                Add photos ({form.watch("otherPhotos")?.length || 0}/10)
                              </p>
                            </div>
                          </div>
                        )}
                        <input
                          id="additional-photos-input"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || [])
                            const currentPhotos = form.watch("otherPhotos") || []

                            const remainingSlots = 10 - currentPhotos.length
                            const filesToProcess = files.slice(0, remainingSlots)

                            for (const file of filesToProcess) {
                              try {
                                const reader = new FileReader()
                                reader.onload = (e) => {
                                  const current = form.getValues("otherPhotos") || []
                                  form.setValue("otherPhotos", [...current, e.target?.result as string])
                                }
                                reader.readAsDataURL(file)
                              } catch (error) {
                                console.error("Photo upload failed:", error)
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Colors</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.watch("colorVariants") || []
                            form.setValue("colorVariants", [...current, { name: "", image: "" }])
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Color
                        </Button>
                        <Button type="button" variant="default" size="sm" onClick={saveColors}>
                          Save Colors
                        </Button>
                      </div>
                    </div>

                    {form.watch("colorVariants")?.length > 0 && (
                      <div className="space-y-3">
                        {form.watch("colorVariants").map((color, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border rounded">
                            <Input
                              placeholder="Color name"
                              value={color.name || ""}
                              onChange={(e) => {
                                const current = form.watch("colorVariants") || []
                                current[index] = { ...current[index], name: e.target.value }
                                form.setValue("colorVariants", [...current])
                              }}
                              className="flex-1"
                            />

                            {color.image ? (
                              <div className="relative">
                                <img
                                  src={color.image || "/placeholder.svg"}
                                  alt="Color"
                                  className="w-16 h-16 object-cover rounded border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-1 -right-1 h-5 w-5 p-0"
                                  onClick={() => {
                                    const current = form.watch("colorVariants") || []
                                    current[index] = { ...current[index], image: "" }
                                    form.setValue("colorVariants", [...current])
                                  }}
                                >
                                  ×
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="w-16 h-16 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-gray-400 flex items-center justify-center"
                                onClick={() => document.getElementById(`color-image-${index}`)?.click()}
                              >
                                <Camera className="h-6 w-6 text-gray-400" />
                              </div>
                            )}

                            <input
                              id={`color-image-${index}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onload = (e) => {
                                    const current = form.watch("colorVariants") || []
                                    current[index] = { ...current[index], image: e.target?.result as string }
                                    form.setValue("colorVariants", [...current])
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }}
                            />

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const current = form.watch("colorVariants") || []
                                form.setValue(
                                  "colorVariants",
                                  current.filter((_, i) => i !== index),
                                )
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4">
                    <h3 className="text-sm font-medium">Product Characteristics</h3>

                    {/* Size management with Technical Specifications display */}
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 bg-muted/20">
                        <div className="grid grid-cols-6 gap-2 mb-4">
                          <div>
                            <Label className="text-xs">Size</Label>
                            <Input
                              value={newSize}
                              onChange={(e) => setNewSize(e.target.value)}
                              placeholder="700x770"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Thickness</Label>
                            <Input
                              value={newThickness}
                              onChange={(e) => setNewThickness(e.target.value)}
                              placeholder="3mm"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Box Size (cm)</Label>
                            <Input
                              value={newBoxSize}
                              onChange={(e) => setNewBoxSize(e.target.value)}
                              placeholder="65x65x37"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Box Volume (m³)</Label>
                            <Input
                              value={newBoxVolume}
                              onChange={(e) => setNewBoxVolume(Number.parseFloat(e.target.value) || 0)}
                              type="number"
                              step="0.001"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Box Weight (kg)</Label>
                            <Input
                              value={newBoxWeight}
                              onChange={(e) => setNewBoxWeight(Number.parseFloat(e.target.value) || 0)}
                              type="number"
                              step="0.01"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Pcs/Box</Label>
                            <Input
                              value={newPcsPerBox}
                              onChange={(e) => setNewPcsPerBox(Number.parseInt(e.target.value) || 0)}
                              type="number"
                              className="text-sm"
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (newSize.trim() && newThickness.trim() && newBoxSize.trim()) {
                              const currentSpecs = form.getValues("technicalSpecifications") || []
                              const safeCurrentSpecs = Array.isArray(currentSpecs) ? currentSpecs : []

                              const newSpec = {
                                size: newSize.trim(),
                                thickness: newThickness.trim(),
                                pcsPerBox: newPcsPerBox,
                                boxSize: newBoxSize.trim(),
                                boxVolume: newBoxVolume,
                                boxWeight: newBoxWeight,
                              }

                              console.log("[v0] Added new size specification:", newSpec)
                              form.setValue("technicalSpecifications", [...safeCurrentSpecs, newSpec], {
                                shouldDirty: true,
                                shouldValidate: true,
                              })

                              // Reset form
                              setNewSize("")
                              setNewThickness("")
                              setNewBoxSize("")
                              setNewBoxVolume(0)
                              setNewBoxWeight(0)
                              setNewPcsPerBox(0)
                            }
                          }}
                        >
                          Save Size Specification
                        </Button>
                      </div>

                      {form.watch("technicalSpecifications")?.length > 0 && (
                        <div className="w-full">
                          <h4 className="text-sm font-medium mb-2">Technical Specifications</h4>
                          <div className="space-y-1">
                            {(Array.isArray(form.watch("technicalSpecifications"))
                              ? form.watch("technicalSpecifications")
                              : []
                            ).map((spec, index) => (
                              <div key={index} className="w-full p-2 bg-muted/30 rounded text-sm">
                                Size: {spec.size}, Thickness: {spec.thickness}, Pcs/Box: {spec.pcsPerBox}, Box Size:{" "}
                                {spec.boxSize}, Box Volume: {spec.boxVolume} m³, Box Weight: {spec.boxWeight} kg
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Specifications Tab */}
            {activeTab === "specifications" && (
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Product Specifications</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const current = form.getValues("productSpecifications") || []
                        const safeCurrent = Array.isArray(current) ? current : []
                        form.setValue(
                          "productSpecifications",
                          [...safeCurrent, { name: "New Specification", value: "", icon: "" }],
                          {
                            shouldDirty: true,
                          },
                        )
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Specification
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(Array.isArray(form.watch("productSpecifications"))
                      ? form.watch("productSpecifications")
                      : []
                    ).map((spec, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <Input
                            value={spec.name || ""}
                            onChange={(e) => {
                              const specs = form.getValues("productSpecifications") || []
                              const safeSpecs = Array.isArray(specs) ? specs : []
                              const updatedSpecs = [...safeSpecs]
                              updatedSpecs[index] = { ...updatedSpecs[index], name: e.target.value }
                              form.setValue("productSpecifications", updatedSpecs, { shouldDirty: true })
                            }}
                            placeholder="Specification name"
                            className="font-medium"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const specs = form.getValues("productSpecifications") || []
                              const safeSpecs = Array.isArray(specs) ? specs : []
                              const updatedSpecs = safeSpecs.filter((_, i) => i !== index)
                              form.setValue("productSpecifications", updatedSpecs, { shouldDirty: true })
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Value</Label>
                            <Input
                              value={spec.value || ""}
                              onChange={(e) => {
                                const specs = form.getValues("productSpecifications") || []
                                const safeSpecs = Array.isArray(specs) ? specs : []
                                const updatedSpecs = [...safeSpecs]
                                updatedSpecs[index] = { ...updatedSpecs[index], value: e.target.value }
                                form.setValue("productSpecifications", updatedSpecs, { shouldDirty: true })
                              }}
                              placeholder="Enter value"
                            />
                          </div>

                          <div>
                            <Label>Icon</Label>
                            <div className="border-2 border-dashed rounded p-2 text-center cursor-pointer hover:border-primary/50">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`spec-icon-${index}`}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    try {
                                      const reader = new FileReader()
                                      reader.onload = (e) => {
                                        const specs = form.getValues("productSpecifications") || []
                                        const safeSpecs = Array.isArray(specs) ? specs : []
                                        const updatedSpecs = [...safeSpecs]
                                        updatedSpecs[index] = {
                                          ...updatedSpecs[index],
                                          icon: e.target?.result as string,
                                        }
                                        form.setValue("productSpecifications", updatedSpecs, { shouldDirty: true })
                                      }
                                      reader.readAsDataURL(file)
                                    } catch (error) {
                                      console.error("Icon upload failed:", error)
                                    }
                                  }
                                }}
                              />
                              <label htmlFor={`spec-icon-${index}`} className="cursor-pointer">
                                {spec.icon ? (
                                  <img
                                    src={spec.icon || "/placeholder.svg"}
                                    alt="Icon"
                                    className="w-8 h-8 object-cover mx-auto rounded"
                                  />
                                ) : (
                                  <div className="space-y-1">
                                    <Upload className="h-4 w-4 mx-auto text-muted-foreground" />
                                    <span className="text-xs">Add Icon</span>
                                  </div>
                                )}
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Applications Tab */}
            {activeTab === "applications" && (
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-4">Interior Applications</h3>
                <div className="space-y-4">
                  {Array.isArray(form.watch("interiorApplications")) &&
                    (form.watch("interiorApplications") || []).map((app, index) => (
                      <div key={index} className="border rounded p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Application {index + 1}</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const apps = form.getValues("interiorApplications") || []
                              form.setValue(
                                "interiorApplications",
                                apps.filter((_, i) => i !== index),
                                { shouldDirty: true },
                              )
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                        <Input
                          value={app.title}
                          onChange={(e) => {
                            const apps = form.getValues("interiorApplications") || []
                            apps[index] = { ...apps[index], title: e.target.value }
                            form.setValue("interiorApplications", apps, { shouldDirty: true })
                          }}
                          placeholder="Title (e.g., Living Room)"
                          className="text-sm"
                        />
                        <Textarea
                          value={app.description}
                          onChange={(e) => {
                            const apps = form.getValues("interiorApplications") || []
                            apps[index] = { ...apps[index], description: e.target.value }
                            form.setValue("interiorApplications", apps, { shouldDirty: true })
                          }}
                          placeholder="Description"
                          className="text-sm"
                          rows={2}
                        />
                        <div className="relative flex h-24 w-32 cursor-pointer items-center justify-center rounded border border-dashed bg-muted/20">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                try {
                                  const base64Url = await uploadImageAsBase64(file)
                                  const apps = form.getValues("interiorApplications") || []
                                  apps[index] = { ...apps[index], image: base64Url }
                                  form.setValue("interiorApplications", apps, { shouldDirty: true })
                                } catch (error) {
                                  console.error("Image upload failed:", error)
                                }
                              }
                            }}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                          />
                          {app.image ? (
                            <img
                              src={app.image || "/placeholder.svg"}
                              alt=""
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">Add image</span>
                          )}
                        </div>
                      </div>
                    ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const current = form.getValues("interiorApplications") || []
                      form.setValue("interiorApplications", [...current, { title: "", description: "", image: "" }], {
                        shouldDirty: true,
                      })
                    }}
                  >
                    Add Interior Application
                  </Button>
                </div>
              </Card>
            )}

            {/* Technical Tab */}
            {activeTab === "technical" && (
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-4">Technical Specifications</h3>
                {form.watch("technicalSpecifications")?.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-3">
                      Saved product specifications that will be displayed on the frontend:
                    </p>
                    {(Array.isArray(form.watch("technicalSpecifications"))
                      ? form.watch("technicalSpecifications")
                      : []
                    ).map((spec, index) => (
                      <div key={index} className="w-full p-3 bg-muted/30 rounded border">
                        <div className="text-sm font-medium">
                          Size: {spec.size}, Thickness: {spec.thickness}, Pcs/Box: {spec.pcsPerBox}; Box Size:{" "}
                          {spec.boxSize}; Box Volume: {spec.boxVolume} m³; Box G.W.: {spec.boxWeight} KG
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No technical specifications added yet.</p>
                    <p className="text-xs mt-1">Add specifications in the Basic Info tab to see them here.</p>
                  </div>
                )}
              </Card>
            )}
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    console.log("[v0] Preview clicked - current form data:", form.getValues())
                    const formData = form.getValues()
                    if (formData.id) {
                      window.open(`/catalog/${formData.id}`, "_blank")
                    } else {
                      toast({
                        title: "Preview not available",
                        description: "Please save the product first to preview it.",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  Preview
                </Button>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mut.isPending}
                  onClick={() => console.log("[v0] Save Product button clicked")}
                >
                  {mut.isPending ? "Saving..." : "Save Product"}
                </Button>
              </div>
              {validationMessage && <div className="text-sm text-destructive mt-2">{validationMessage}</div>}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
