"use client"

import * as React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react"
import { addToCart } from "@/lib/cart"
import { useToast } from "@/hooks/use-toast"

type Props = {
  product: Product | any
  onAdded?: () => void
  onAdd?: (sel: { color?: string; size?: string; thickness?: string }) => void
  actionLabel?: string
  defaultColorName?: string
  defaultSize?: string
  defaultThickness?: string
}

export function ProductDetails({
  product,
  onAdded,
  onAdd,
  actionLabel = "Add to Cart",
  defaultColorName,
  defaultSize,
  defaultThickness,
}: Props) {
  const { toast } = useToast()

  // Build colors, sizes, thickness
  const colors = React.useMemo(
    () => {
      // Try new structure first
      if (Array.isArray(product?.colorVariants)) {
        return product.colorVariants.map((c: any) => ({
          name: c?.name || "Color",
          image: c?.image || "",
        }))
      }
      // Fallback to legacy structure
      if (Array.isArray(product?.colors)) {
        return product.colors.map((c: any) => ({
          name: c?.nameEn || c?.nameRu || c?.name || "Color",
          image: c?.mainImage || c?.image || "",
        }))
      }
      return []
    },
    [product?.colorVariants, product?.colors],
  )
  const sizes: string[] = Array.isArray(product?.sizes) ? product.sizes : []
  const thicknesses: string[] = Array.isArray(product?.thickness) ? product.thickness : []

  // Selections
  const [colorIdx, setColorIdx] = React.useState<number | null>(null)
  const [size, setSize] = React.useState<string>("")
  const [thickness, setThickness] = React.useState<string>("")

  React.useEffect(() => {
    setColorIdx(null)
    setSize("")
    setThickness("")
    if (defaultColorName) {
      const idx = colors.findIndex((c) => c.name === defaultColorName)
      if (idx >= 0) setColorIdx(idx)
    }
    if (defaultSize && sizes.includes(defaultSize)) setSize(defaultSize)
    if (defaultThickness && thicknesses.includes(defaultThickness)) setThickness(defaultThickness)
  }, [product?.id, defaultColorName, defaultSize, defaultThickness, colors, sizes, thicknesses])

  // Main gallery (depends on color)
  const gallery: string[] = React.useMemo(() => {
    const imgs: string[] = []
    const colorImg = colorIdx !== null ? colors[colorIdx!]?.image : ""
    if (colorImg) imgs.push(colorImg)
    if (product?.photos?.main) imgs.push(product.photos.main)
    if (product?.thumbnailUrl) imgs.push(product.thumbnailUrl)
    if (Array.isArray(product?.photos?.others)) imgs.push(...product.photos.others)
    if (Array.isArray(product?.gallery)) imgs.push(...product.gallery)
    return Array.from(new Set(imgs.filter(Boolean))).slice(0, 12)
  }, [product, colors, colorIdx])

  const [galleryIdx, setGalleryIdx] = React.useState(0)
  React.useEffect(() => setGalleryIdx(0), [colorIdx])
  const galleryMain = gallery[galleryIdx] || product?.thumbnailUrl || "/modern-tech-product.png"

  // Infographics slider (separate block at bottom)
  const infographics: string[] = React.useMemo(() => {
    const imgs: string[] = []
    if (product?.infographics?.main) imgs.push(product.infographics.main)
    if (Array.isArray(product?.infographics?.others)) imgs.push(...product.infographics.others)
    return Array.from(new Set(imgs.filter(Boolean))).slice(0, 20)
  }, [product])

  const [infoIdx, setInfoIdx] = React.useState(0)
  const infoMain = infographics[infoIdx]

  function handlePrimary() {
    const hasColors = colors.length > 0
    if (hasColors && colorIdx === null) {
      alert("Выберите цвет.")
      return
    }
    if (sizes.length > 0 && !size) {
      alert("Выберите размер.")
      return
    }
    if (thicknesses.length > 0 && !thickness) {
      alert("Выберите толщину.")
      return
    }

    const sel = {
      color: colorIdx !== null ? colors[colorIdx!]?.name : undefined,
      size: size || undefined,
      thickness: thickness || undefined,
    }

    if (onAdd) {
      // Parent (e.g. edit dialog) will handle updates and its own toasts
      onAdd(sel)
      return
    }

    // Default: add to cart here and show success toast
    addToCart({
      id: product.id,
      sku: product.sku || product.id,
      name: product.name,
      category: product.category,
      sub: product.sub,
      color: sel.color,
      size: sel.size,
      thickness: sel.thickness,
      qtyBoxes: 1,
      pcsPerBox: Number(product.pcsPerBox || 0),
      boxKg: Number(product.boxKg || 0),
      boxM3: Number(product.boxM3 || 0),
      addedAt: Date.now(),
      thumbnailUrl:
        (colorIdx !== null ? colors[colorIdx!]?.image : "") || product.thumbnailUrl || "/product-thumbnail.png",
    })

    toast({
      title: "Added to Cart",
      description: `${product.name} — ${[sel.color, sel.thickness, sel.size].filter(Boolean).join(", ")}`,
    })
    onAdded?.()
  }

  return (
    <div className="space-y-8">
      {/* Top: main gallery + controls */}
      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        {/* Left: gallery */}
        <div className="p-2 md:p-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
            <Image
              src={galleryMain || "/placeholder.svg"}
              alt={`${product?.name || "Product"} main`}
              fill
              className="object-cover"
            />
            {gallery.length > 1 && (
              <>
                <button
                  onClick={() => setGalleryIdx((v) => (v - 1 + gallery.length) % gallery.length)}
                  aria-label="Previous image"
                  className="group absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded bg-white/90 p-2 shadow hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setGalleryIdx((v) => (v + 1) % gallery.length)}
                  aria-label="Next image"
                  className="group absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded bg-white/90 p-2 shadow hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setGalleryIdx(i)}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded border",
                    i === galleryIdx && "ring-2 ring-emerald-600",
                  )}
                  aria-label={`Select image ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src || "/placeholder.svg"} alt={`thumb ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: content */}
        <div className="space-y-5 p-2 md:border-l md:p-4">
          <div>
            <div className="text-sm text-muted-foreground">
              {product?.category} · {product?.sub}
            </div>
            <h1 className="text-xl font-semibold">{product?.name}</h1>
          </div>

          {/* Colors */}
          {colors.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-medium">Color</div>
              <div className="flex flex-wrap gap-2">
                {colors.map((c, i) => (
                  <button
                    key={`${c.name}-${i}`}
                    onClick={() => setColorIdx(i)}
                    className={cn(
                      "relative size-10 overflow-hidden rounded-none border",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                      colorIdx === i && "ring-2 ring-emerald-600",
                    )}
                    aria-pressed={colorIdx === i}
                    aria-label={c.name}
                    title={c.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.image || "/placeholder.svg?height=40&width=40&query=color+swatch"}
                      alt={c.name}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {colorIdx === null ? "Не выбран" : `Выбрано: ${colors[colorIdx]?.name}`}
              </div>
            </div>
          )}

          {/* Size */}
          {sizes.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-medium">Size</div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
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
          )}

          {/* Thickness */}
          {thicknesses.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-medium">Thickness</div>
              <div className="flex flex-wrap gap-2">
                {thicknesses.map((t) => (
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
          )}

          {/* Specs */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-sm px-2.5 py-1.5">
              Pcs/Box: {Number(product?.pcsPerBox || 0)}
            </Badge>
            <Badge variant="secondary" className="text-sm px-2.5 py-1.5">
              Box KG: {Number(product?.boxKg || 0)}
            </Badge>
            <Badge variant="secondary" className="text-sm px-2.5 py-1.5">
              Box m³: {Number(product?.boxM3 || 0)}
            </Badge>
          </div>

          {/* Action */}
          <div className="pt-1">
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              onClick={handlePrimary}
              aria-label={actionLabel}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {actionLabel}
            </Button>
          </div>

          {/* Technical Description */}
          <div className="space-y-2">
            <div className="text-sm font-semibold">Technical Description</div>
            <p className="text-sm text-muted-foreground">
              {product?.description ||
                product?.technicalDescription ||
                "High-quality finish suitable for residential and commercial interiors. Easy to install."}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom: Infographics slider */}
      {infographics.length > 0 && (
        <div className="border-t pt-6">
          <div className="mb-3 text-sm font-semibold">Infographics</div>

          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={infoMain || "/placeholder.svg?height=600&width=1000&query=infographics"}
              alt="Infographic"
              className="h-full w-full object-cover"
            />
            {infographics.length > 1 && (
              <>
                <button
                  onClick={() => setInfoIdx((v) => (v - 1 + infographics.length) % infographics.length)}
                  aria-label="Previous infographic"
                  className="group absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded bg-white/90 p-2 shadow hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setInfoIdx((v) => (v + 1) % infographics.length)}
                  aria-label="Next infographic"
                  className="group absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded bg-white/90 p-2 shadow hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {infographics.length > 1 && (
            <div className="mt-3 grid grid-cols-6 gap-2 md:grid-cols-8">
              {infographics.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setInfoIdx(i)}
                  className={cn(
                    "relative aspect-video overflow-hidden rounded border",
                    i === infoIdx && "ring-2 ring-orange-600",
                  )}
                  aria-label={`Select infographic ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src || "/placeholder.svg"}
                    alt={`infographic ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
