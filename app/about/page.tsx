"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type AboutPageData = {
  hero: {
    visible: boolean
    title: string
    description: string
    images: string[]
    mainImage: string
  }
  approach: {
    visible: boolean
    title: string
    description: string
    features: Array<{
      title: string
      description: string
      icon?: string
    }>
  }
  orderProcess: {
    visible: boolean
    title: string
    description: string
    buttonText: string
    buttonLink: string
    steps: Array<{
      number: string
      title: string
      description: string
    }>
  }
  blockOrder: string[]
}

const defaultData: AboutPageData = {
  hero: {
    visible: true,
    title: "About Stick'N'Style",
    description:
      "We are a B2B supplier of 3D wall panels, flooring, and adhesive solutions. Our goal is to make bulk ordering simple, accurate, and export-ready. From product configuration to container planning, we focus on clarity and speed.",
    images: ["/modern-interior-3d-panels.png"],
    mainImage: "/modern-interior-3d-panels.png",
  },
  approach: {
    visible: true,
    title: "Our approach",
    description: "Ergonomics first. We streamline tables, inputs, and exports to fit wholesale workflows.",
    features: [
      {
        title: "Streamlined Workflow",
        description: "Totals for boxes, pcs, kg, and m³ are always visible",
      },
      {
        title: "Export Ready",
        description: "Quick export to PDF/Excel for wholesale orders",
      },
    ],
  },
  orderProcess: {
    visible: true,
    title: "Create an Order in 1 Click",
    description:
      "Add multiple items fast, track boxes/kg/m³, and export to PDF / Excel. Optimized for wholesale orders.",
    buttonText: "Create Now",
    buttonLink: "/create-order",
    steps: [
      {
        number: "1",
        title: "Pick products",
        description: "Browse catalog, select categories, and set sizes, thickness, and colors.",
      },
      {
        number: "2",
        title: "Fill boxes",
        description: "Input boxes per SKU; see live totals for pcs, kg, and m³. The right panel is your cart.",
      },
      {
        number: "3",
        title: "Export & submit",
        description: "Download a PDF/CSV and submit your order to our sales team.",
      },
    ],
  },
  blockOrder: ["hero", "approach", "orderProcess"],
}

export default function AboutPage() {
  const [data, setData] = useState<AboutPageData>(defaultData)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const res = await fetch("/api/pages/about")
      if (res.ok) {
        const pageData = await res.json()
        if (pageData.content) {
          const parsed = JSON.parse(pageData.content)
          setData({ ...defaultData, ...parsed })
        }
      }
    } catch (error) {
      console.error("Failed to load about page data:", error)
    }
  }

  const nextImage = () => {
    if (data.hero.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % data.hero.images.length)
    }
  }

  const prevImage = () => {
    if (data.hero.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + data.hero.images.length) % data.hero.images.length)
    }
  }

  const renderBlock = (blockType: string) => {
    switch (blockType) {
      case "hero":
        if (!data.hero.visible) return null
        return (
          <div key="hero" className="grid gap-6 md:grid-cols-2 items-center">
            <div>
              <h1 className="text-3xl font-semibold mb-4">{data.hero.title}</h1>
              <p className="text-muted-foreground">{data.hero.description}</p>
            </div>
            <div className="relative h-64 md:h-80 rounded-lg border overflow-hidden">
              {data.hero.images.length > 0 && (
                <>
                  <Image
                    src={data.hero.images[currentImageIndex] || data.hero.mainImage}
                    alt="About us"
                    fill
                    className="object-cover"
                  />
                  {data.hero.images.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {data.hero.images.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index === currentImageIndex ? "bg-white" : "bg-white/50"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )

      case "approach":
        if (!data.approach.visible) return null
        return (
          <Card key="approach" className="mt-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">{data.approach.title}</h2>
              <p className="text-muted-foreground mb-6">{data.approach.description}</p>
              {data.approach.features.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.approach.features.map((feature, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )

      case "orderProcess":
        if (!data.orderProcess.visible) return null
        return (
          <div key="orderProcess" className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold mb-4">{data.orderProcess.title}</h2>
              <p className="text-muted-foreground mb-6">{data.orderProcess.description}</p>
              <Button asChild className="bg-orange-500 hover:bg-orange-600">
                <a href={data.orderProcess.buttonLink}>{data.orderProcess.buttonText}</a>
              </Button>
            </div>
            <div className="space-y-4">
              {data.orderProcess.steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">{data.blockOrder.map(renderBlock)}</main>
      <SiteFooter />
    </div>
  )
}
