"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ProductGalleryBlockData } from "@/lib/types"

interface ProductGalleryBlockProps {
  data?: ProductGalleryBlockData
}

export function ProductGalleryBlock({ data }: ProductGalleryBlockProps) {
  const defaultData: ProductGalleryBlockData = {
    title: "Our Product Categories",
    subtitle: "Explore our wide range of premium wall panels for every style and application",
    products: [
      {
        id: "wood-panels",
        name: "Wood Effect Panels",
        image: "/wood-plank-flooring.png",
        category: "wall-panel",
        link: "/catalog/wall-panel",
      },
      {
        id: "stone-panels",
        name: "Stone & Brick Panels",
        image: "/stone-brick-wall-panels.png",
        category: "wall-panel",
        link: "/catalog/wall-panel",
      },
      {
        id: "modern-panels",
        name: "Modern 3D Panels",
        image: "/modern-interior-3d-panels.png",
        category: "wall-panel",
        link: "/catalog/wall-panel",
      },
      {
        id: "fabric-panels",
        name: "Fabric Texture Panels",
        image: "/fabric-texture-wall-panels.png",
        category: "flooring",
        link: "/catalog/flooring",
      },
    ],
    visible: true,
  }

  const blockData = data || defaultData
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemsPerPage = 4

  if (!blockData.visible) return null

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + itemsPerPage >= blockData.products.length ? 0 : prev + itemsPerPage))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? Math.max(0, blockData.products.length - itemsPerPage) : Math.max(0, prev - itemsPerPage),
    )
  }

  const visibleItems = blockData.products.slice(currentIndex, currentIndex + itemsPerPage)

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 lg:text-4xl mb-4">{blockData.title}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{blockData.subtitle}</p>
        </div>

        <div className="relative">
          {/* Navigation buttons */}
          {blockData.products.length > itemsPerPage && (
            <div className="flex justify-between items-center mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextSlide}
                disabled={currentIndex + itemsPerPage >= blockData.products.length}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Product grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {visibleItems.map((product) => (
              <Link key={product.id} href={product.link} className="group block">
                <div className="overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300">
                  <div className="aspect-[4/3] overflow-hidden">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      width={400}
                      height={300}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm capitalize">Категория: {product.category.replace("-", " ")}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Indicators */}
          {blockData.products.length > itemsPerPage && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: Math.ceil(blockData.products.length / itemsPerPage) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index * itemsPerPage)}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    Math.floor(currentIndex / itemsPerPage) === index
                      ? "bg-orange-600"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
