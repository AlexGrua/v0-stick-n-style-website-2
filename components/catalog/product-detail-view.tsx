"use client"

import * as React from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Building,
  Zap,
  Shield,
  Droplets,
  Thermometer,
  Volume2,
  Flame,
  X,
} from "lucide-react"

interface ProductDetailViewProps {
  product: Product
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0)
  const [selectedColor, setSelectedColor] = React.useState<string>("")
  const [activeMode, setActiveMode] = React.useState<"slider" | "color">("slider")
  const [modalOpen, setModalOpen] = React.useState(false)
  const [modalImageIndex, setModalImageIndex] = React.useState(0)
  const [modalImages, setModalImages] = React.useState<string[]>([])

  const sliderImages = React.useMemo(() => {
    const images: string[] = []

    // Add main image first
    if (product.image_url) images.push(product.image_url)

    // Add additional photos from specifications
    if (product.specifications?.otherPhotos && Array.isArray(product.specifications.otherPhotos)) {
      images.push(...product.specifications.otherPhotos)
    }

    return [...new Set(images)].filter(Boolean)
  }, [product])

  const mainImage = React.useMemo(() => {
    // Если активен цветовой режим и выбран цвет, показываем фото цвета
    if (activeMode === "color" && selectedColor && product.colorVariants) {
      const selectedColorVariant = product.colorVariants.find((variant: any) => variant.name === selectedColor)
      if (selectedColorVariant?.image) {
        return selectedColorVariant.image
      }
    }

    // Если активен слайдерный режим или нет выбранного цвета, показываем слайдер
    if (sliderImages.length > selectedImageIndex) {
      return sliderImages[selectedImageIndex]
    }

    return product.image_url || "/diverse-products-still-life.png"
  }, [activeMode, selectedColor, product.colorVariants, sliderImages, selectedImageIndex, product.image_url])

  React.useEffect(() => {
    console.log("[v0] Product data:", product)
    console.log("[v0] Product specifications:", product.specifications)
    console.log("[v0] Slider images:", sliderImages)
  }, [product, sliderImages])

  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName)
    setActiveMode("color") // Переключаемся в цветовой режим
  }

  const nextImage = () => {
    if (sliderImages.length > 1) {
      setSelectedImageIndex((prev) => (prev + 1) % sliderImages.length)
      setActiveMode("slider") // Переключаемся в слайдерный режим
    }
  }

  const prevImage = () => {
    if (sliderImages.length > 1) {
      setSelectedImageIndex((prev) => (prev - 1 + sliderImages.length) % sliderImages.length)
      setActiveMode("slider") // Переключаемся в слайдерный режим
    }
  }

  // Get specifications from product data
  const specs = product.specifications || {}

  const productSKU = specs.sku || product.sku || ""

  const categoryName =
    product.category?.name ||
    product.categoryName ||
    specs.categoryName ||
    specs.category ||
    product.categories?.name ||
    (product.category_id ? `Category ${product.category_id}` : "")

  const subcategoryName =
    product.subcategoryName || // From API response root
    product.subcategory?.name ||
    specs.subcategoryName ||
    specs.subcategory ||
    product.specifications?.subcategoryName ||
    ""

  // Icon mapping for specifications
  const getSpecIcon = (key: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      material: <Shield className="h-4 w-4 text-yellow-600" />,
      usage: <Home className="h-4 w-4 text-yellow-600" />,
      application: <Building className="h-4 w-4 text-yellow-600" />,
      adhesion: <Zap className="h-4 w-4 text-yellow-600" />,
      fireproof: <Flame className="h-4 w-4 text-orange-600" />,
      waterproof: <Droplets className="h-4 w-4 text-blue-500" />,
      soundproof: <Volume2 className="h-4 w-4 text-yellow-600" />,
      thermal: <Thermometer className="h-4 w-4 text-yellow-600" />,
      "cold-resistant": <Thermometer className="h-4 w-4 text-yellow-600" />,
      "thermal insulation": <Thermometer className="h-4 w-4 text-yellow-600" />,
      physical: <Thermometer className="h-4 w-4 text-yellow-600" />,
    }
    return iconMap[key.toLowerCase()] || <Shield className="h-4 w-4 text-gray-600" />
  }

  const openImageModal = (images: string[], startIndex = 0) => {
    console.log("[v0] Opening modal with images:", images)
    console.log("[v0] Start index:", startIndex)
    setModalImages(images)
    setModalImageIndex(startIndex)
    setModalOpen(true)
    document.body.style.overflow = "hidden" // Prevent background scrolling
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalImageIndex(0)
    setModalImages([])
    document.body.style.overflow = "unset" // Restore scrolling
  }

  const nextModalImage = () => {
    console.log("[v0] Next modal image clicked")
    console.log("[v0] Current index:", modalImageIndex)
    console.log("[v0] Total images:", modalImages.length)
    setModalImageIndex((prev) => {
      const newIndex = (prev + 1) % modalImages.length
      console.log("[v0] New index:", newIndex)
      return newIndex
    })
  }

  const prevModalImage = () => {
    console.log("[v0] Previous modal image clicked")
    console.log("[v0] Current index:", modalImageIndex)
    console.log("[v0] Total images:", modalImages.length)
    setModalImageIndex((prev) => {
      const newIndex = (prev - 1 + modalImages.length) % modalImages.length
      console.log("[v0] New index:", newIndex)
      return newIndex
    })
  }

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalOpen) return

      if (e.key === "Escape") {
        closeModal()
      } else if (e.key === "ArrowRight") {
        nextModalImage()
      } else if (e.key === "ArrowLeft") {
        prevModalImage()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [modalOpen, modalImages.length])

  return (
    <div className="space-y-16">
      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden">
            <Image src={mainImage || "/placeholder.svg"} alt={product.name} fill className="object-cover" priority />
            {sliderImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all z-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all z-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {sliderImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {sliderImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImageIndex(index)
                      setActiveMode("slider") // Переключаемся в слайдерный режим при клике на точку
                    }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      selectedImageIndex === index ? "bg-lime-500" : "bg-white/50",
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {product.name}
              {productSKU && <span className="font-bold text-gray-900"> • {productSKU}</span>}
            </h1>
            {(categoryName || subcategoryName) && (
              <p className="text-lg text-gray-600 font-medium">
                {categoryName}
                {categoryName && subcategoryName && " -- "}
                {subcategoryName}
              </p>
            )}
          </div>

          {/* Available Colors */}
          {product.colorVariants && product.colorVariants.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Available Colors</h3>
              <div className="flex gap-3 mb-3">
                {product.colorVariants.map((variant: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleColorSelect(variant.name)}
                    className={cn(
                      "w-16 h-16 rounded-lg border-3 overflow-hidden transition-all",
                      selectedColor === variant.name
                        ? "border-lime-500 ring-2 ring-lime-200" // Changed from green-500 to lime-500 for brand consistency
                        : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    <Image
                      src={variant.image || "/placeholder.svg?height=64&width=64&query=color"}
                      alt={variant.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Selected: <span className="font-medium">{selectedColor}</span>
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Description</h3>
            <p className="text-gray-700 leading-relaxed text-base">
              {product.description ||
                "High-quality product with excellent durability and modern design, perfect for enhancing both residential and commercial spaces."}
            </p>
          </div>

          {/* Specifications */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-6 uppercase tracking-wide">Specifications</h3>
            <div className="space-y-6">
              {(specs.material || specs.productSpecifications?.material) && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                    {getSpecIcon("material")}
                    Material
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {(() => {
                      const materialData = specs.material || specs.productSpecifications?.material
                      if (Array.isArray(materialData)) {
                        return materialData.map((item: any, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-lime-50 text-lime-700 border-lime-200">
                            {typeof item === "object" ? item.description || item.name || String(item) : String(item)}
                          </Badge>
                        ))
                      } else if (typeof materialData === "object" && materialData !== null) {
                        return (
                          <Badge variant="secondary" className="bg-lime-50 text-lime-700 border-lime-200">
                            {materialData.description || materialData.name || String(materialData)}
                          </Badge>
                        )
                      } else {
                        return (
                          <Badge variant="secondary" className="bg-lime-50 text-lime-700 border-lime-200">
                            {String(materialData)}
                          </Badge>
                        )
                      }
                    })()}
                  </div>
                </div>
              )}

              {(specs.usage || specs.productSpecifications?.usage) && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                    {getSpecIcon("usage")}
                    Usage
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {(() => {
                      const usageData = specs.usage || specs.productSpecifications?.usage
                      if (Array.isArray(usageData)) {
                        return usageData.map((item: any, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-lime-50 text-lime-700 border-lime-200">
                            {typeof item === "object" ? item.description || item.name || String(item) : String(item)}
                          </Badge>
                        ))
                      } else if (typeof usageData === "object" && usageData !== null) {
                        return (
                          <Badge variant="secondary" className="bg-lime-50 text-lime-700 border-lime-200">
                            {usageData.description || usageData.name || String(usageData)}
                          </Badge>
                        )
                      } else {
                        return (
                          <Badge variant="secondary" className="bg-lime-50 text-lime-700 border-lime-200">
                            {String(usageData)}
                          </Badge>
                        )
                      }
                    })()}
                  </div>
                </div>
              )}

              {(specs.application || specs.productSpecifications?.application) && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                    {getSpecIcon("application")}
                    Application
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {(() => {
                      const applicationData = specs.application || specs.productSpecifications?.application
                      if (Array.isArray(applicationData)) {
                        return applicationData.map((item: any, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-lime-50 text-lime-700 border-lime-200">
                            {typeof item === "object" ? item.description || item.name || String(item) : String(item)}
                          </Badge>
                        ))
                      } else if (typeof applicationData === "object" && applicationData !== null) {
                        return (
                          <Badge variant="secondary" className="bg-lime-50 text-lime-700 border-lime-200">
                            {applicationData.description || applicationData.name || String(applicationData)}
                          </Badge>
                        )
                      } else {
                        return (
                          <Badge variant="secondary" className="bg-lime-50 text-lime-700 border-lime-200">
                            {String(applicationData)}
                          </Badge>
                        )
                      }
                    })()}
                  </div>
                </div>
              )}

              {(specs.adhesion || specs.productSpecifications?.adhesion) && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                    {getSpecIcon("adhesion")}
                    Adhesion
                  </h4>
                  <Badge variant="secondary" className="bg-lime-50 text-lime-700 border-lime-200">
                    {(() => {
                      const adhesionData = specs.adhesion || specs.productSpecifications?.adhesion
                      if (Array.isArray(adhesionData) && adhesionData.length > 0) {
                        const firstItem = adhesionData[0]
                        return typeof firstItem === "object"
                          ? firstItem.description || firstItem.name || String(firstItem)
                          : String(firstItem)
                      } else if (typeof adhesionData === "object" && adhesionData !== null) {
                        return adhesionData.description || adhesionData.name || String(adhesionData)
                      }
                      return String(adhesionData)
                    })()}
                  </Badge>
                </div>
              )}

              {((specs.physicalProperties &&
                Array.isArray(specs.physicalProperties) &&
                specs.physicalProperties.length > 0) ||
                (specs.productSpecifications?.physicalProperties &&
                  Array.isArray(specs.productSpecifications.physicalProperties) &&
                  specs.productSpecifications.physicalProperties.length > 0)) && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                    {getSpecIcon("physical")}
                    Physical Properties
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {(specs.physicalProperties || specs.productSpecifications?.physicalProperties || []).map(
                      (prop: any, index: number) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-lime-50 text-lime-700 border-lime-200 flex items-center gap-1"
                        >
                          <span>
                            {typeof prop === "object" ? prop.description || prop.name || String(prop) : String(prop)}
                          </span>
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Suitable Surfaces */}
              {specs.suitableSurfaces && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wider">Suitable Surfaces</h4>
                  <div className="flex gap-2 flex-wrap">
                    {Array.isArray(specs.suitableSurfaces) ? (
                      specs.suitableSurfaces.map((surface: string, index: number) => (
                        <Badge key={index} variant="outline" className="bg-gray-50">
                          {surface}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="bg-gray-50">
                        {specs.suitableSurfaces}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {specs.interiorApplications &&
        Array.isArray(specs.interiorApplications) &&
        specs.interiorApplications.length > 0 && (
          <div className="bg-gray-50 py-16 -mx-4 px-4 rounded-3xl">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Interior Applications</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {specs.interiorApplications.slice(0, 3).map((app: any, index: number) => {
                  const allAppImages = specs.interiorApplications.map((app: any) => app.image).filter(Boolean)

                  console.log("[v0] Interior app:", app)
                  console.log("[v0] All app images for modal:", allAppImages)
                  console.log("[v0] Current app image:", app.image)

                  const handleImageClick = () => {
                    console.log("[v0] Image clicked, opening modal")
                    console.log("[v0] Opening modal with app images:", allAppImages)
                    console.log("[v0] Starting at index:", index)
                    if (allAppImages.length > 0) {
                      openImageModal(allAppImages, index)
                    } else {
                      console.log("[v0] No app images available for modal")
                    }
                  }

                  return (
                    <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                      <div className="relative aspect-[4/3] cursor-pointer group" onClick={handleImageClick}>
                        <Image
                          src={
                            app.image ||
                            `/placeholder.svg?height=300&width=400&query=${app.name || `interior ${index + 1}`}`
                          }
                          alt={app.name || `Interior ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="bg-white/90 rounded-full p-2">
                            <svg
                              className="w-6 h-6 text-gray-700"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold text-xl mb-3 text-gray-900">{app.name}</h3>
                        <p className="text-gray-600 leading-relaxed">{app.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

      {specs.technicalSpecifications &&
        Array.isArray(specs.technicalSpecifications) &&
        specs.technicalSpecifications.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold mb-8">Technical Specifications</h2>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Size (mm)
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Thickness (mm)
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Pieces per Box
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Box Size (cm)
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Weight (kg)
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Volume (m³)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {specs.technicalSpecifications.map((sizeSpec: any, sizeIndex: number) =>
                      sizeSpec.thicknesses && Array.isArray(sizeSpec.thicknesses) ? (
                        sizeSpec.thicknesses.map((thickness: any, thicknessIndex: number) => (
                          <tr key={`${sizeIndex}-${thicknessIndex}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                              {sizeSpec.size || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                              {thickness.thickness || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                              {thickness.pcsPerBox || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                              {thickness.boxSize || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                              {thickness.boxWeight || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                              {thickness.boxVolume || "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr key={sizeIndex} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                            {sizeSpec.size || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                            {sizeSpec.thickness || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                            {sizeSpec.pcsPerBox || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                            {sizeSpec.boxSize || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                            {sizeSpec.boxWeight || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                            {sizeSpec.boxVolume || "-"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />

          {/* Modal Content */}
          <div className="relative z-10 max-w-7xl max-h-[90vh] mx-4">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>

            {/* Image */}
            <div className="relative">
              <Image
                src={modalImages[modalImageIndex] || "/placeholder.svg"}
                alt={`Interior Application ${modalImageIndex + 1}`}
                width={1200}
                height={800}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                priority
              />

              {/* Navigation Arrows */}
              {modalImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log("[v0] Left arrow button clicked")
                      prevModalImage()
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all z-20"
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log("[v0] Right arrow button clicked")
                      nextModalImage()
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all z-20"
                  >
                    <ChevronRight className="h-6 w-6 text-gray-700" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {modalImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {modalImageIndex + 1} / {modalImages.length}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
