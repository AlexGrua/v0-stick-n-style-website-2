"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Puzzle, ChevronLeft, ChevronRight } from "lucide-react"
import type { HeroBlockData } from "@/lib/types"

interface HeroBlockProps {
  data?: HeroBlockData
}

export function HeroBlock({ data }: HeroBlockProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const defaultData: HeroBlockData = {
    title: "Premium Adhesive Wall Panels",
    subtitle: "Stick'N'Style",
    description:
      "Transform your space with our innovative stick-on wall panels. Easy installation, premium quality, wholesale pricing for professionals.",
    backgroundImage: "/modern-interior-3d-panels.png",
    images: [
      { id: "1", url: "/modern-interior-3d-panels.png", alt: "Modern interior with premium wall panels" },
      { id: "2", url: "/wood-flooring-textures.png", alt: "Wood flooring textures" },
      { id: "3", url: "/fabric-texture-wall-panels.png", alt: "Fabric texture wall panels" },
    ],
    buttons: [
      {
        id: "1",
        text: "Create Order Now",
        link: "/create-n-order",
        variant: "primary",
      },
      {
        id: "2",
        text: "Browse Catalog",
        link: "/catalog",
        variant: "secondary",
      },
    ],
    ctaText: "Create Order Now",
    ctaLink: "/create-n-order",
    visible: true,
  }

  const blockData = data || defaultData

  const imagesToShow =
    blockData.images && blockData.images.length > 0
      ? blockData.images
      : [{ id: "legacy", url: blockData.backgroundImage || "/modern-interior-3d-panels.png", alt: "Hero image" }]

  useEffect(() => {
    if (imagesToShow.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % imagesToShow.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [imagesToShow.length])

  if (!blockData.visible) return null

  const buttonsToRender =
    blockData.buttons && blockData.buttons.length > 0
      ? blockData.buttons
      : [{ id: "legacy", text: blockData.ctaText, link: blockData.ctaLink, variant: "primary" as const }]

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imagesToShow.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imagesToShow.length) % imagesToShow.length)
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Левая часть - текстовый контент */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 lg:text-5xl xl:text-6xl">
                {blockData.subtitle}
                <span className="block text-orange-600">{blockData.title}</span>
              </h1>
              <p className="text-lg text-gray-600 lg:text-xl">{blockData.description}</p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              {buttonsToRender.map((button, index) => (
                <Button
                  key={button.id}
                  size="lg"
                  className={button.variant === "primary" || index === 0 ? "bg-orange-600 hover:bg-orange-700" : ""}
                  variant={button.variant === "secondary" && index > 0 ? "outline" : "default"}
                  asChild
                >
                  <Link href={button.link}>
                    {index === 0 && <Puzzle className="mr-2 h-5 w-5" />}
                    {button.text}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 shadow-2xl relative">
              <Image
                src={imagesToShow[currentImageIndex]?.url || "/modern-interior-3d-panels.png"}
                alt={imagesToShow[currentImageIndex]?.alt || "Hero image"}
                fill
                className="object-cover transition-opacity duration-500"
                priority
              />

              {/* Кнопки навигации слайдера (показываем только если больше одного изображения) */}
              {imagesToShow.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                </>
              )}
            </div>

            {/* Индикаторы слайдов (показываем только если больше одного изображения) */}
            {imagesToShow.length > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                {imagesToShow.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentImageIndex ? "bg-orange-600 scale-110" : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Декоративные элементы */}
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-orange-100 opacity-60" />
            <div className="absolute -top-4 -left-4 h-16 w-16 rounded-full bg-blue-100 opacity-60" />
          </div>
        </div>
      </div>
    </section>
  )
}
