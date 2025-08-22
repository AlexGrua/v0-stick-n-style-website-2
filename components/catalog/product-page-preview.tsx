"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ArrowLeft, ShoppingCart } from "lucide-react"
import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"
import { addToCart } from "@/lib/cart"
import { useToast } from "@/hooks/use-toast"

/**
 * Full-page product UI used for Preview in admin.
 * Renders the same structure as the real product page using a provided Product.
 */
export function ProductPagePreview({ product }: { product: Product }) {
  const { toast } = useToast()
  const [activeIdx, setActiveIdx] = React.useState(0)
  const [colorIdx, setColorIdx] = React.useState(0)
  const [size, setSize] = React.useState<string>("")
  const [thickness, setThickness] = React.useState<string>("")

  // Infographics slider state
  const [infoIdx, setInfoIdx] = React.useState(0)

  React.useEffect(() => {
    if (!product) return
    setActiveIdx(0)
    setColorIdx(0)
    setSize(product.sizes?.[0] ?? "")
    setThickness(product.thickness?.[0] ?? "")
    setInfoIdx(0)
  }, [product])

  // Derive colors from product if present
  const COLORS = React.useMemo(() => {
    if (product?.colors?.length) {
      return product.colors.map((c: any) => ({
        name: c.nameEn || c.nameRu || "Color",
        image: c.mainImage as string | undefined,
      }))
    }
    // fallback palette
    return [
      { name: "White", image: undefined },
      { name: "Gray", image: undefined },
      { name: "Black", image: undefined },
      { name: "Beige", image: undefined },
      { name: "Sand", image: undefined },
    ]
  }, [product?.colors])

  const baseGallery = React.useMemo(
    () => [
      (COLORS[colorIdx]?.image as string | undefined) || product?.thumbnailUrl || "/primary-product-display.png",
      "/product-angled-view.png",
      "/closeup-texture-surface.png",
      "/detailed-edge-finish.png",
      "/product-back-packaging.png",
    ],
    [product?.thumbnailUrl, COLORS, colorIdx],
  )

  const activeImage = React.useMemo(() => {
    if (!product) return "/placeholder.svg"
    if (activeIdx === 0) {
      return (COLORS[colorIdx]?.image as string | undefined) || product.thumbnailUrl || "/primary-product-display.png"
    }
    const q = encodeURIComponent(
      `${product.name} ${COLORS[colorIdx]?.name || ""} ${size || ""} ${thickness || ""} variant ${activeIdx + 1}`,
    )
    return `/placeholder.svg?height=1200&width=1200&query=${q}`
  }, [product, activeIdx, colorIdx, size, thickness, COLORS])

  function prev() {
    setActiveIdx((v) => (v - 1 + baseGallery.length) % baseGallery.length)
  }
  function next() {
    setActiveIdx((v) => (v + 1) % baseGallery.length)
  }

  // Infographics gallery
  const infoGallery = React.useMemo(() => {
    if (!product) return []
    const imgs: string[] = []
    const main = (product as any)?.infographics?.main as string | undefined
    const others = ((product as any)?.infographics?.others as string[] | undefined) || []
    if (main) imgs.push(main)
    if (others?.length) imgs.push(...others)
    if (imgs.length) return imgs

    const base = product?.name || "Product"
    return Array.from({ length: 5 }).map((_, i) => {
      const q = encodeURIComponent(`${base} interior ${i + 1}`)
      return `/abstract-geometric-shapes.png?height=720&width=1280&query=${q}`
    })
  }, [product])

  function prevInfo() {
    setInfoIdx((v) => (v - 1 + infoGallery.length) % infoGallery.length)
  }
  function nextInfo() {
    setInfoIdx((v) => (v + 1) % infoGallery.length)
  }

  function onAddToCart() {
    if (!product) return
    const selSize = size || product.sizes?.[0] || ""
    const selThickness = thickness || product.thickness?.[0] || ""
    const selColor = COLORS[colorIdx]?.name

    addToCart({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      sub: product.sub,
      color: selColor,
      size: selSize,
      thickness: selThickness,
      qtyBoxes: 1,
      pcsPerBox: product.pcsPerBox,
      boxKg: product.boxKg,
      boxM3: product.boxM3,
      thumbnailUrl: (COLORS[colorIdx]?.image as string | undefined) || product.thumbnailUrl || "/product-thumbnail.png",
      addedAt: Date.now(),
    })

    toast({
      title: "Added to Cart",
      description: `${product.name} — ${[selColor, selThickness, selSize].filter(Boolean).join(", ")}`,
    })
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="container mx-auto px-4 py-6">
        {/* Back arrow (non-functional in preview) */}
        <div className="mb-4">
          <Link
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{"Назад к каталогу"}</span>
          </Link>
        </div>

        {!product ? (
          <div className="rounded border p-6 text-muted-foreground">{"Loading…"}</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            {/* Gallery */}
            <div>
              <div className="relative aspect-square overflow-hidden rounded border">
                <Image
                  src={activeImage || "/placeholder.svg"}
                  alt={`${product.name} main`}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={prev}
                  aria-label="Previous image"
                  className="group absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded bg-white/90 p-2 shadow hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={next}
                  aria-label="Next image"
                  className="group absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded bg-white/90 p-2 shadow hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {baseGallery.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded border",
                      i === activeIdx && "ring-2 ring-emerald-600",
                    )}
                    aria-label={`Select image ${i + 1}`}
                  >
                    <Image
                      src={
                        i === 0 && ((COLORS[colorIdx]?.image as string | undefined) || product.thumbnailUrl)
                          ? ((COLORS[colorIdx]?.image as string | undefined) || product.thumbnailUrl)!
                          : `/placeholder.svg?height=160&width=160&query=${encodeURIComponent(
                              `${product.name} thumb ${i + 1}`,
                            )}`
                      }
                      alt={`thumb ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Technical description */}
              <div className="mt-6 space-y-2">
                <div className="text-sm font-semibold">{"Technical Description"}</div>
                <p className="text-sm text-muted-foreground">
                  {product.description ||
                    (product as any)?.technicalDescription ||
                    "High-quality finish suitable for residential and commercial interiors. Easy to install. Compatible with standard adhesives. Refer to datasheet for surface prep and maintenance."}
                </p>
              </div>

              {/* Infographics */}
              <div className="mt-6 space-y-2">
                <div className="text-sm font-semibold">{"Infographics"}</div>
                <div className="relative aspect-video overflow-hidden rounded border">
                  <Image
                    src={infoGallery[infoIdx] || "/placeholder.svg"}
                    alt="Interior showcase"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={prevInfo}
                    aria-label="Previous infographic"
                    className="group absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded bg-white/90 p-2 shadow hover:bg-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextInfo}
                    aria-label="Next infographic"
                    className="group absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded bg-white/90 p-2 shadow hover:bg-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {infoGallery.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setInfoIdx(i)}
                      className={cn(
                        "relative aspect-video overflow-hidden rounded border",
                        i === infoIdx && "ring-2 ring-emerald-600",
                      )}
                      aria-label={`Select infographic ${i + 1}`}
                    >
                      <Image src={src || "/placeholder.svg"} alt={`Interior ${i + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-5">
              <div>
                <div className="text-sm text-muted-foreground">
                  {product.category} · {product.sub}
                </div>
                <h1 className="text-2xl font-semibold">{product.name}</h1>
              </div>

              {/* Colors - square swatches with image fill */}
              <div>
                <div className="mb-2 text-sm font-medium">{"Color"}</div>
                <div className="grid grid-cols-5 gap-2">
                  {COLORS.map((c, i) => (
                    <button
                      key={`${c.name}-${i}`}
                      onClick={() => {
                        setColorIdx(i)
                        setActiveIdx(0)
                      }}
                      className={cn("h-10 w-full rounded-none border", i === colorIdx && "ring-2 ring-emerald-600")}
                      aria-label={c.name}
                      title={c.name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          c.image ||
                          "/placeholder.svg?height=40&width=40&query=color%20swatch%20image" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                        alt={c.name}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {"Selected: "}
                  {COLORS[colorIdx]?.name}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <div className="mb-2 text-sm font-medium">{"Size"}</div>
                <div className="flex flex-wrap gap-2">
                  {(product.sizes || []).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={cn(
                        "rounded border px-2 py-1 text-sm",
                        size === s && "bg-emerald-50 ring-2 ring-emerald-600",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thickness */}
              <div>
                <div className="mb-2 text-sm font-medium">{"Thickness"}</div>
                <div className="flex flex-wrap gap-2">
                  {(product.thickness || []).map((t) => (
                    <button
                      key={t}
                      onClick={() => setThickness(t)}
                      className={cn(
                        "rounded border px-2 py-1 text-sm",
                        thickness === t && "bg-emerald-50 ring-2 ring-emerald-600",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specs */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {"Pcs/Box: "}
                  {product.pcsPerBox}
                </Badge>
                <Badge variant="secondary">
                  {"Box KG: "}
                  {product.boxKg}
                </Badge>
                <Badge variant="secondary">
                  {"Box m³: "}
                  {product.boxM3}
                </Badge>
              </div>

              <div className="pt-2">
                <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={onAddToCart}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {"Add to Cart"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
