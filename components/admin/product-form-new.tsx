"use client"

import { useState } from "react"
import React from "react"
import { api } from "@/lib/api"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Upload, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Types
interface Category {
  id: string
  name: string
  subcategories?: { id: string; name: string }[]
}

interface Supplier {
  id: string
  name: string
  code: string
  shortName?: string
}

interface ColorVariant {
  name: string
  colorCode: string
  image: string
  priceModifier: number
}

interface ThicknessSpec {
  thickness: string
  pcsPerBox: number
  boxSize: string
  boxVolume: number
  boxWeight: number
  priceModifier: number
}

interface TechnicalSpec {
  size: string
  thicknesses: ThicknessSpec[]
}

interface ProductSpec {
  description: string
  icon: string
}

interface InteriorApplication {
  name: string
  description: string
  image: string
}

interface Product {
  id?: number
  sku: string
  name: string
  slug?: string
  description?: string
  category_id?: string | number
  subcategory_id?: string | number
  image_url?: string
  specifications?: {
    supplierId?: string | number
    supplierCode?: string
    colorVariants?: ColorVariant[]
    technicalSpecifications?: TechnicalSpec[]
    otherPhotos?: string[]
    productSpecifications?: {
      material: ProductSpec[]
      usage: ProductSpec[]
      application: ProductSpec[]
      physicalProperties: ProductSpec[]
      adhesion: ProductSpec[]
    }
    interiorApplications?: InteriorApplication[]
  }
}

// Form Schema
const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category_id: z.string().min(1, "Category is required"),
  subcategory_id: z.string().optional(),
  image_url: z.string().min(1, "Main photo is required"),
  supplierId: z.string().min(1, "Supplier is required"),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  prefillFrom?: Product
}

export function ProductFormNew({ open, onOpenChange, product, prefillFrom }: ProductFormProps) {
  console.log("[v0] ProductFormNew initialized", { productId: product?.id })

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: product?.sku || prefillFrom?.sku || "",
      name: product?.name || prefillFrom?.name || "",
      description: product?.description || prefillFrom?.description || "",
      category_id: String(product?.category_id || prefillFrom?.category_id || ""),
      subcategory_id: String(product?.subcategory_id || prefillFrom?.subcategory_id || ""),
      supplierId:
        String(product?.specifications?.supplierId || prefillFrom?.specifications?.supplierId || ""),
      image_url: product?.image_url || prefillFrom?.image_url || "",
    },
  })

  // State for complex data
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>(
    product?.specifications?.colorVariants || prefillFrom?.specifications?.colorVariants || [],
  )
  const [technicalSpecs, setTechnicalSpecs] = useState<TechnicalSpec[]>(
    product?.specifications?.technicalSpecifications || prefillFrom?.specifications?.technicalSpecifications || [],
  )
  const [otherPhotos, setOtherPhotos] = useState<string[]>(
    product?.specifications?.otherPhotos || prefillFrom?.specifications?.otherPhotos || [],
  )
  const [productSpecs, setProductSpecs] = useState({
    material: [] as ProductSpec[],
    usage: [] as ProductSpec[],
    application: [] as ProductSpec[],
    physicalProperties: [] as ProductSpec[],
    adhesion: [] as ProductSpec[],
  })
  const [interiorApps, setInteriorApps] = useState<InteriorApplication[]>(
    product?.specifications?.interiorApplications || prefillFrom?.specifications?.interiorApplications || [],
  )

  // Current editing states
  const [currentColorImage, setCurrentColorImage] = useState<string>("")
  const [colorName, setColorName] = useState<string>("")
  const [currentSize, setCurrentSize] = useState({ size: "", thicknesses: [] as ThicknessSpec[] })
  const [currentThickness, setCurrentThickness] = useState({
    thickness: "",
    pcsPerBox: 0,
    boxSize: "",
    boxVolume: 0,
    boxWeight: 0,
    priceModifier: 0,
  })

  // Data fetching
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")

  const [colorError, setColorError] = useState<string>("")
  const [supplierError, setSupplierError] = useState<string>("")

  React.useEffect(() => {
    if (product?.id) {
      const loadProductData = async () => {
        try {
          const response = await fetch(`/api/products/${product.id}`)
          if (!response.ok) throw new Error("Failed to fetch product")
          const productData = await response.json()

          console.log("[v0] Loading product data for edit:", productData)

          setValue("sku", productData.sku || "")
          setValue("name", productData.name || "")
          setValue("description", productData.description || "")
          setValue("category_id", String(productData.category_id || ""))
          setValue("subcategory_id", String(productData.subcategory_id || ""))
          setValue("supplierId", String(productData.specifications?.supplierId || ""))
          setValue("image_url", productData.image_url || "")

          // Load specifications data
          if (productData.specifications) {
            const specs = productData.specifications

            // Load color variants
            if (specs.colorVariants && Array.isArray(specs.colorVariants)) {
              setColorVariants(specs.colorVariants)
              console.log("[v0] Loaded color variants:", specs.colorVariants.length)
            }

            // Load technical specifications
            if (specs.technicalSpecifications && Array.isArray(specs.technicalSpecifications)) {
              setTechnicalSpecs(specs.technicalSpecifications)
              console.log("[v0] Loaded technical specs:", specs.technicalSpecifications.length)
            }

            // Load product specifications
            if (specs.productSpecifications) {
              setProductSpecs(specs.productSpecifications)
              console.log("[v0] Loaded product specs")
            }

            // Load interior applications
            if (specs.interiorApplications && Array.isArray(specs.interiorApplications)) {
              setInteriorApps(specs.interiorApplications)
              console.log("[v0] Loaded interior applications:", specs.interiorApplications.length)
            }

            // Load other photos
            if (specs.otherPhotos && Array.isArray(specs.otherPhotos)) {
              setOtherPhotos(specs.otherPhotos)
              console.log("[v0] Loaded other photos:", specs.otherPhotos.length)
            }
          }

          if (productData.category_id) {
            const categoryResponse = await fetch(`/api/categories/${productData.category_id}`)
            if (categoryResponse.ok) {
              const categoryData = await categoryResponse.json()
                    if (categoryData.subcategories && Array.isArray(categoryData.subcategories)) {
        setSubcategories(categoryData.subcategories)
        console.log("[v0] Loaded subcategories for edit:", categoryData.subcategories.length)
              }
            }
          }
        } catch (error) {
          console.error("[v0] Error loading product data:", error)
        }
      }

      loadProductData()
    }
  }, [product?.id]) // Убрал setValue из зависимостей чтобы предотвратить бесконечные перерендеры

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories")
        if (!response.ok) throw new Error("Failed to fetch categories")
        const data = await response.json()
        const categoriesArray = Array.isArray(data) ? data : data.items || []
        setCategories(categoriesArray)
        console.log("[v0] Loaded categories:", categoriesArray.length)
      } catch (error) {
        console.error("[v0] Error fetching categories:", error)
        setCategories([])
      }
    }

    const fetchSuppliers = async () => {
      try {
        const data = await api<{ suppliers: Supplier[]; data?: any[]; items?: any[] }>("/api/suppliers")
        const suppliersArray = (data as any).suppliers || (data as any).items || (data as any).data || []
        console.log("[v0] Loaded suppliers:", suppliersArray.length)
        console.log(
          "[v0] Suppliers data:",
                     suppliersArray.map((s: any) => ({ id: s.id, name: s.shortName || s.name })),
        )
        setSuppliers(suppliersArray)
      } catch (error) {
        console.error("[v0] Error fetching suppliers:", error)
        setSuppliers([])
      }
    }

    fetchCategories()
    fetchSuppliers()
  }, []) // Убрал все зависимости - загружаем данные только один раз при монтировании

  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
             if (name === "category_id" && value.category_id) {
         const categoryId = String(value.category_id)
         const selectedCategory = categories.find((cat) => String(cat.id) === categoryId)
                 if (selectedCategory && selectedCategory.subcategories) {
          // Extract subcategories from the subcategories field
          const subcategories = Array.isArray(selectedCategory.subcategories) ? selectedCategory.subcategories : []
          setSubcategories(subcategories)
          console.log("[v0] Loaded subcategories for category", categoryId, ":", subcategories.length)
          console.log("[v0] Subcategories data:", subcategories)
         } else {
           setSubcategories([])
           console.log("[v0] No subcategories found for category", categoryId)
         }
         // Reset subcategory selection when category changes
         setValue("subcategory_id", "")
       } else if (name === "category_id" && !value.category_id) {
         setSubcategories([])
       }
    })
    return () => subscription.unsubscribe()
  }, [categories, watch, setValue]) // Используем subscription вместо прямого watch для предотвращения перерендеров

  // Save function
  const handleSave = async (data: ProductFormData) => {
    try {
      console.log("[v0] Starting product save with values:", data)

      const payload = {
        ...data,
        specifications: {
          supplierId: data.supplierId,
          supplierCode: suppliers?.find((s) => s.id === data.supplierId)?.code || "",
          colorVariants,
          technicalSpecifications: technicalSpecs,
          otherPhotos,
          productSpecifications: productSpecs,
          interiorApplications: interiorApps,
        },
      }

      console.log("[v0] Full payload:", payload)

      const isEditing = product?.id
      const url = isEditing ? `/api/products/${product.id}` : "/api/products"
      const method = isEditing ? "PUT" : "POST"

      console.log("[v0] Request details:", { isEditing, url, method, productId: product?.id })

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("[v0] Product saved successfully:", result)

      onOpenChange?.(false)
      window.location.reload()
    } catch (error) {
      console.error("[v0] Error saving product:", error)
      alert("Error saving product. Please try again.")
    }
  }

  const onSubmit = (data: any) => {
    console.log("[v0] Form submitted with data:", data)
    handleSave(data as ProductFormData)
  }

  // Helper functions
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleImageUpload = async (file: File, callback: (base64: string) => void) => {
    try {
      const base64 = await convertToBase64(file)
      callback(base64)
    } catch (error) {
      console.error("[v0] Image upload error:", error)
    }
  }

  const addColor = () => {
    console.log("[v0] Save Color clicked", { colorName, currentColorImage })
    setColorError("")

    if (!colorName.trim()) {
      setColorError("Please fill color name")
      return
    }

    if (!currentColorImage) {
      setColorError("Please upload image")
      return
    }

    const newColor: ColorVariant = {
      name: colorName,
      colorCode: colorName.toUpperCase().replace(/\s+/g, ""),
      image: currentColorImage,
      priceModifier: 0,
    }

    console.log("[v0] Adding color", newColor)
    setColorVariants([...colorVariants, newColor])
    setColorName("")
    setCurrentColorImage("")
    setColorError("")
  }

  const removeColor = (index: number) => {
    setColorVariants(colorVariants.filter((_, i) => i !== index))
  }

  // Size management
  const addThicknessToCurrentSize = () => {
    if (!currentThickness.thickness || !currentThickness.pcsPerBox) {
      alert("Please fill all thickness fields")
      return
    }

    console.log("[v0] Adding thickness to current size", currentThickness)
    setCurrentSize({
      ...currentSize,
      thicknesses: [...currentSize.thicknesses, { ...currentThickness }],
    })
    setCurrentThickness({
      thickness: "",
      pcsPerBox: 0,
      boxSize: "",
      boxVolume: 0,
      boxWeight: 0,
      priceModifier: 0,
    })
  }

  const saveCurrentSize = () => {
    if (!currentSize.size.trim() || currentSize.thicknesses.length === 0) {
      alert("Please fill size and add at least one thickness")
      return
    }

    console.log("[v0] Saving current size", currentSize)
    setTechnicalSpecs([...technicalSpecs, { ...currentSize }])
    setCurrentSize({ size: "", thicknesses: [] })
  }

  const removeTechnicalSpec = (index: number) => {
    setTechnicalSpecs(technicalSpecs.filter((_, i) => i !== index))
  }

  // Interior Applications
  const addInteriorApp = () => {
    setInteriorApps([...interiorApps, { name: "", description: "", image: "" }])
  }

  const updateInteriorApp = (index: number, field: keyof InteriorApplication, value: string) => {
    const updated = [...interiorApps]
    updated[index] = { ...updated[index], [field]: value }
    setInteriorApps(updated)
  }

  const removeInteriorApp = (index: number) => {
    setInteriorApps(interiorApps.filter((_, i) => i !== index))
  }

  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
             <DialogContent className="w-[95vw] max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Create Product"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <Button onClick={handleSubmit(onSubmit)} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Save Product
            </Button>
          </div>

          <Tabs defaultValue="basic" className="w-full">
                         <TabsList className="grid w-full grid-cols-5 h-12 gap-1">
               <TabsTrigger value="basic" className="h-10 text-xs whitespace-nowrap px-2">
                 Basic Info
               </TabsTrigger>
               <TabsTrigger value="photos" className="h-10 text-xs whitespace-nowrap px-2">
                 Photos
               </TabsTrigger>
               <TabsTrigger value="specs" className="h-10 text-xs whitespace-nowrap px-2">
                 Specs
               </TabsTrigger>
               <TabsTrigger value="properties" className="h-10 text-xs whitespace-nowrap px-2">
                 Properties
               </TabsTrigger>
               <TabsTrigger value="applications" className="h-10 text-xs whitespace-nowrap px-2">
                 Apps
               </TabsTrigger>
             </TabsList>

                         {/* Basic Info Tab */}
             <TabsContent value="basic" className="space-y-3">
               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sku">SKU *</Label>
                      <Input id="sku" {...register("sku")} placeholder="e.g., BK01" />
                      {errors.sku && <p className="text-red-500 text-sm">{errors.sku.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input id="name" {...register("name")} placeholder="Product name" />
                      {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Product description"
                      rows={3}
                    />
                    {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <select
                        {...register("category_id")}
                        className="w-full p-2 border rounded-md"
                        onChange={(e) => {
                          setValue("category_id", e.target.value)
                          setSelectedCategoryId(e.target.value)
                        }}
                      >
                        <option value="">Select Category</option>
                        {(categories || []).map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="subcategory">Subcategory</Label>
                      <select
                        {...register("subcategory_id")}
                        className="w-full p-2 border rounded-md"
                        disabled={!selectedCategoryId || subcategories.length === 0}
                      >
                        <option value="">Select Subcategory</option>
                        {subcategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                      {!selectedCategoryId && <p className="text-gray-500 text-sm mt-1">Select category first</p>}
                      {subcategories.length === 0 && selectedCategoryId && (
                        <p className="text-red-500 text-sm mt-1">No subcategories available for this category</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Supplier *</label>
                    <select {...register("supplierId")} className="w-full p-2 border rounded-md">
                      <option value="">Select Supplier</option>
                      {suppliers && suppliers.length > 0 ? (
                        suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id.toString()}>
                                                         {supplier.shortName || supplier.name || `Supplier ${supplier.id}`}
                          </option>
                        ))
                      ) : (
                        <option disabled>Loading suppliers...</option>
                      )}
                    </select>
                    {errors.supplierId && <p className="text-red-500 text-sm mt-1">{errors.supplierId.message}</p>}
                    {suppliers.length === 0 && <p className="text-red-500 text-sm mt-1">No suppliers loaded</p>}
                    <p className="text-gray-500 text-xs mt-1">Debug: {suppliers.length} suppliers loaded</p>
                  </div>
                </div>
            </TabsContent>

            {/* Photos & Colors Tab */}
            <TabsContent value="photos" className="space-y-4">
              {/* Main Photo */}
              <Card>
                <CardHeader>
                  <CardTitle>Main Photo *</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(file, (base64) => {
                            setValue("image_url", base64)
                          })
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {watch("image_url") && (
                      <img
                        src={watch("image_url") || "/placeholder.svg"}
                        alt="Main product"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                    )}
                    {errors.image_url && <p className="text-red-500 text-sm">{errors.image_url.message}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Photos */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Photos (up to 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        files.forEach((file) => {
                          if (otherPhotos.length < 10) {
                            handleImageUpload(file, (base64) => {
                              setOtherPhotos((prev) => [...prev, base64])
                            })
                          }
                        })
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {otherPhotos.length > 0 && (
                      <div className="grid grid-cols-5 gap-2">
                        {otherPhotos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={photo || "/placeholder.svg"}
                              alt={`Additional ${index + 1}`}
                              className="w-20 h-20 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => setOtherPhotos(otherPhotos.filter((_, i) => i !== index))}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Colors */}
              <Card>
                <CardHeader>
                  <CardTitle>Color Variants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Color Form */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-medium">Add New Color</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Color Name</Label>
                        <Input
                          value={colorName}
                          onChange={(e) => setColorName(e.target.value)}
                          placeholder="e.g., White Matte"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Color Photo</Label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageUpload(file, (base64) => {
                              setCurrentColorImage(base64)
                            })
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      {currentColorImage && (
                        <img
                          src={currentColorImage || "/placeholder.svg"}
                          alt="Color preview"
                          className="w-16 h-16 object-cover rounded border mt-2"
                        />
                      )}
                    </div>
                    <Button onClick={addColor} className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Save Color
                    </Button>
                  </div>

                  {colorError && <p className="text-red-500 text-sm mt-2">{colorError}</p>}

                  {/* Saved Colors */}
                  {colorVariants.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Saved Colors</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {colorVariants.map((color, index) => (
                          <div key={index} className="border rounded-lg p-3 relative">
                            <button
                              type="button"
                              onClick={() => removeColor(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <img
                              src={color.image || "/placeholder.svg"}
                              alt={color.name}
                              className="w-full h-20 object-cover rounded mb-2"
                            />
                            <p className="text-sm font-medium">{color.name}</p>
                            <p className="text-xs text-gray-500">{color.colorCode}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Technical Specs Tab */}
            <TabsContent value="specs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add Size Form */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-medium">Add New Size</h4>
                                         <div>
                       <Label>Size</Label>
                       <Input
                         value={currentSize.size}
                         onChange={(e) => setCurrentSize({ ...currentSize, size: e.target.value })}
                         placeholder="e.g., 70x70"
                       />
                     </div>

                    {/* Add Thickness to Current Size */}
                    <div className="border-t pt-4">
                      <h5 className="font-medium mb-3">Add Thickness to This Size</h5>
                                             <div className="grid grid-cols-2 gap-4 mb-4">
                         <div>
                           <Label>Thickness</Label>
                           <Input
                             value={currentThickness.thickness}
                             onChange={(e) => setCurrentThickness({ ...currentThickness, thickness: e.target.value })}
                             placeholder="e.g., 3mm"
                           />
                         </div>
                         <div>
                           <Label>Pcs/Box</Label>
                           <Input
                             type="number"
                             value={currentThickness.pcsPerBox}
                             onChange={(e) =>
                               setCurrentThickness({ ...currentThickness, pcsPerBox: Number(e.target.value) })
                             }
                             placeholder="25"
                             className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                           />
                         </div>
                       </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label>Box Size (cm)</Label>
                          <Input
                            value={currentThickness.boxSize}
                            onChange={(e) => setCurrentThickness({ ...currentThickness, boxSize: e.target.value })}
                            placeholder="120x80x15"
                          />
                        </div>
                        <div>
                          <Label>Box Volume (m³)</Label>
                                                     <Input
                             type="number"
                             step="0.001"
                             value={currentThickness.boxVolume}
                             onChange={(e) =>
                               setCurrentThickness({ ...currentThickness, boxVolume: Number(e.target.value) })
                             }
                             placeholder="0.144"
                             className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                           />
                        </div>
                        <div>
                          <Label>Box Weight (kg)</Label>
                                                     <Input
                             type="number"
                             step="0.1"
                             value={currentThickness.boxWeight}
                             onChange={(e) =>
                               setCurrentThickness({ ...currentThickness, boxWeight: Number(e.target.value) })
                             }
                             placeholder="18.5"
                             className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                           />
                        </div>
                      </div>
                      <Button onClick={addThicknessToCurrentSize} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Thickness
                      </Button>
                    </div>

                    {/* Current Size Thicknesses */}
                    {currentSize.thicknesses.length > 0 && (
                      <div className="border-t pt-4">
                        <h5 className="font-medium mb-3">Thicknesses for {currentSize.size}</h5>
                        <div className="space-y-2">
                          {currentSize.thicknesses.map((thickness, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                              <strong>Thickness:</strong> {thickness.thickness},<strong> Pcs/Box:</strong>{" "}
                              {thickness.pcsPerBox},<strong> Box Size:</strong> {thickness.boxSize},
                              <strong> Volume:</strong> {thickness.boxVolume}m³,
                              <strong> Weight:</strong> {thickness.boxWeight}kg
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button onClick={saveCurrentSize} className="bg-blue-600 hover:bg-blue-700">
                      <Upload className="w-4 h-4 mr-2" />
                      Save Size
                    </Button>
                  </div>

                  {/* Saved Technical Specifications */}
                  {technicalSpecs.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Saved Technical Specifications</h4>
                      {technicalSpecs.map((spec, specIndex) => (
                        <div key={specIndex} className="border rounded-lg p-4 relative">
                          <button
                            type="button"
                            onClick={() => removeTechnicalSpec(specIndex)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            <X className="w-4 h-4" />
                          </button>
                                                     <h5 className="font-medium mb-2">
                             Size: {spec.size}
                           </h5>
                          <div className="space-y-2">
                            {spec.thicknesses.map((thickness, thickIndex) => (
                              <div key={thickIndex} className="bg-gray-50 p-3 rounded text-sm">
                                <strong>
                                  {specIndex + 1}.{thickIndex + 1}
                                </strong>{" "}
                                Size: {spec.size}, Thickness: {thickness.thickness}, Pcs/Box: {thickness.pcsPerBox}, Box
                                Size: {thickness.boxSize}, Box Volume: {thickness.boxVolume} m³, Box Weight:{" "}
                                {thickness.boxWeight} kg
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Properties Tab */}
            <TabsContent value="properties" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Product Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Material */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Material</h4>
                    {productSpecs.material.map((spec, index) => (
                      <div key={index} className="flex gap-4 mb-4 p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <Label>Description</Label>
                          <Textarea
                            value={spec.description}
                            onChange={(e) => {
                              const updated = [...productSpecs.material]
                              updated[index] = { ...updated[index], description: e.target.value }
                              setProductSpecs({ ...productSpecs, material: updated })
                            }}
                            placeholder="Material description"
                          />
                        </div>
                        <div className="w-32">
                          <Label>Icon</Label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(file, (base64) => {
                                  const updated = [...productSpecs.material]
                                  updated[index] = { ...updated[index], icon: base64 }
                                  setProductSpecs({ ...productSpecs, material: updated })
                                })
                              }
                            }}
                            className="text-xs"
                          />
                          {spec.icon && (
                            <img src={spec.icon || "/placeholder.svg"} alt="Icon" className="w-8 h-8 mt-2 rounded" />
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updated = productSpecs.material.filter((_, i) => i !== index)
                            setProductSpecs({ ...productSpecs, material: updated })
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setProductSpecs({
                          ...productSpecs,
                          material: [...productSpecs.material, { description: "", icon: "" }],
                        })
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Material
                    </Button>
                  </div>

                  {/* Usage */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Usage</h4>
                    {productSpecs.usage.map((spec, index) => (
                      <div key={index} className="flex gap-4 mb-4 p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <Label>Description</Label>
                          <Textarea
                            value={spec.description}
                            onChange={(e) => {
                              const updated = [...productSpecs.usage]
                              updated[index] = { ...updated[index], description: e.target.value }
                              setProductSpecs({ ...productSpecs, usage: updated })
                            }}
                            placeholder="Usage description"
                          />
                        </div>
                        <div className="w-32">
                          <Label>Icon</Label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(file, (base64) => {
                                  const updated = [...productSpecs.usage]
                                  updated[index] = { ...updated[index], icon: base64 }
                                  setProductSpecs({ ...productSpecs, usage: updated })
                                })
                              }
                            }}
                            className="text-xs"
                          />
                          {spec.icon && (
                            <img src={spec.icon || "/placeholder.svg"} alt="Icon" className="w-8 h-8 mt-2 rounded" />
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updated = productSpecs.usage.filter((_, i) => i !== index)
                            setProductSpecs({ ...productSpecs, usage: updated })
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setProductSpecs({
                          ...productSpecs,
                          usage: [...productSpecs.usage, { description: "", icon: "" }],
                        })
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Usage
                    </Button>
                  </div>

                  {/* Application */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Application</h4>
                    {productSpecs.application.map((spec, index) => (
                      <div key={index} className="flex gap-4 mb-4 p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <Label>Description</Label>
                          <Textarea
                            value={spec.description}
                            onChange={(e) => {
                              const updated = [...productSpecs.application]
                              updated[index] = { ...updated[index], description: e.target.value }
                              setProductSpecs({ ...productSpecs, application: updated })
                            }}
                            placeholder="Application description"
                          />
                        </div>
                        <div className="w-32">
                          <Label>Icon</Label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(file, (base64) => {
                                  const updated = [...productSpecs.application]
                                  updated[index] = { ...updated[index], icon: base64 }
                                  setProductSpecs({ ...productSpecs, application: updated })
                                })
                              }
                            }}
                            className="text-xs"
                          />
                          {spec.icon && (
                            <img src={spec.icon || "/placeholder.svg"} alt="Icon" className="w-8 h-8 mt-2 rounded" />
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updated = productSpecs.application.filter((_, i) => i !== index)
                            setProductSpecs({ ...productSpecs, application: updated })
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setProductSpecs({
                          ...productSpecs,
                          application: [...productSpecs.application, { description: "", icon: "" }],
                        })
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Application
                    </Button>
                  </div>

                  {/* Physical Properties */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Physical Properties</h4>
                    {productSpecs.physicalProperties.map((spec, index) => (
                      <div key={index} className="flex gap-4 mb-4 p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <Label>Description</Label>
                          <Textarea
                            value={spec.description}
                            onChange={(e) => {
                              const updated = [...productSpecs.physicalProperties]
                              updated[index] = { ...updated[index], description: e.target.value }
                              setProductSpecs({ ...productSpecs, physicalProperties: updated })
                            }}
                            placeholder="Physical property description"
                          />
                        </div>
                        <div className="w-32">
                          <Label>Icon</Label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(file, (base64) => {
                                  const updated = [...productSpecs.physicalProperties]
                                  updated[index] = { ...updated[index], icon: base64 }
                                  setProductSpecs({ ...productSpecs, physicalProperties: updated })
                                })
                              }
                            }}
                            className="text-xs"
                          />
                          {spec.icon && (
                            <img src={spec.icon || "/placeholder.svg"} alt="Icon" className="w-8 h-8 mt-2 rounded" />
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updated = productSpecs.physicalProperties.filter((_, i) => i !== index)
                            setProductSpecs({ ...productSpecs, physicalProperties: updated })
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setProductSpecs({
                          ...productSpecs,
                          physicalProperties: [...productSpecs.physicalProperties, { description: "", icon: "" }],
                        })
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Physical Property
                    </Button>
                  </div>

                  {/* Adhesion */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Adhesion</h4>
                    {productSpecs.adhesion.map((spec, index) => (
                      <div key={index} className="flex gap-4 mb-4 p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <Label>Description</Label>
                          <Textarea
                            value={spec.description}
                            onChange={(e) => {
                              const updated = [...productSpecs.adhesion]
                              updated[index] = { ...updated[index], description: e.target.value }
                              setProductSpecs({ ...productSpecs, adhesion: updated })
                            }}
                            placeholder="Adhesion description"
                          />
                        </div>
                        <div className="w-32">
                          <Label>Icon</Label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(file, (base64) => {
                                  const updated = [...productSpecs.adhesion]
                                  updated[index] = { ...updated[index], icon: base64 }
                                  setProductSpecs({ ...productSpecs, adhesion: updated })
                                })
                              }
                            }}
                            className="text-xs"
                          />
                          {spec.icon && (
                            <img src={spec.icon || "/placeholder.svg"} alt="Icon" className="w-8 h-8 mt-2 rounded" />
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updated = productSpecs.adhesion.filter((_, i) => i !== index)
                            setProductSpecs({ ...productSpecs, adhesion: updated })
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setProductSpecs({
                          ...productSpecs,
                          adhesion: [...productSpecs.adhesion, { description: "", icon: "" }],
                        })
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Adhesion
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Interior Applications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={addInteriorApp} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Interior Application
                  </Button>

                  {interiorApps.map((app, index) => (
                    <div key={index} className="border rounded-lg p-4 relative">
                      <button
                        type="button"
                        onClick={() => removeInteriorApp(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="space-y-4">
                        <div>
                          <Label>Application Name</Label>
                          <Input
                            value={app.name}
                            onChange={(e) => updateInteriorApp(index, "name", e.target.value)}
                            placeholder="e.g., Kitchen"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={app.description}
                            onChange={(e) => updateInteriorApp(index, "description", e.target.value)}
                            placeholder="Description of application in this space"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Application Photo</Label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(file, (base64) => {
                                  updateInteriorApp(index, "image", base64)
                                })
                              }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {app.image && (
                            <img
                              src={app.image || "/placeholder.svg"}
                              alt={app.name}
                              className="w-32 h-32 object-cover rounded-lg border mt-2"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
