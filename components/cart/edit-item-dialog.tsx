"use client"

import * as React from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { CartItem } from "@/lib/cart"
import { updateCartItem } from "@/lib/cart"
import type { Product } from "@/lib/types"

async function fetchProduct(id: string): Promise<Product> {
  const r = await fetch(`/api/products/${id}`, { cache: "no-store" })
  if (!r.ok) throw new Error("Failed to load product")
  return r.json()
}

export function EditItemDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  item: CartItem | null
}) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [product, setProduct] = React.useState<Product | null>(null)

  // Local editable selections
  const [selColor, setSelColor] = React.useState<string>("")
  const [selSize, setSelSize] = React.useState<string>("")
  const [selThickness, setSelThickness] = React.useState<string>("")

  React.useEffect(() => {
    let active = true
    if (!open || !item) return
    setLoading(true)
    fetchProduct(item.id)
      .then((p) => {
        if (!active) return
        setProduct(p)
        // initialize selections from current cart item
        setSelColor(item.color || "")
        setSelSize(item.size || "")
        setSelThickness(item.thickness || "")
      })
      .catch(() => {
        if (active) setProduct(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [open, item])

  const colors: string[] = (() => {
    // Try new structure first
    if (Array.isArray((product as any)?.colorVariants)) {
      return (product as any).colorVariants
        .map((c: any) => c?.name || "")
        .filter(Boolean)
    }
    // Fallback to legacy structure
    if ((product?.colors as any)?.map) {
      return (product?.colors as any)
        .map((c: any) => c?.nameEn || c?.nameRU || c?.nameRu || c?.name || "")
        .filter(Boolean)
    }
    // Fallback to colorOptions
    if (Array.isArray((product as any)?.colorOptions)) {
      return (product as any).colorOptions as string[]
    }
    // Fallback to item color
    return item?.color ? [item.color] : []
  })()

  const sizes: string[] =
    (Array.isArray((product as any)?.sizes) ? ((product as any).sizes as string[]) : []) ||
    (item?.size ? [item.size] : [])

  const thicknesses: string[] =
    (Array.isArray((product as any)?.thickness) ? ((product as any).thickness as string[]) : []) ||
    (item?.thickness ? [item.thickness] : [])

  const previewImg =
    item?.thumbnailUrl || (product as any)?.thumbnailUrl || (product as any)?.photos?.main || "/product-thumbnail.png"

  function closeOnce() {
    onOpenChange(false)
  }

  const confirm = () => {
    if (!item) return
    updateCartItem(item.variantKey, {
      color: selColor || "",
      size: selSize || "",
      thickness: selThickness || "",
      ...(product && {
        name: product.name,
        sku: product.sku || product.id,
        category: product.category,
        sub: product.sub,
        pcsPerBox: Number((product as any).pcsPerBox || item.pcsPerBox || 0),
        boxKg: Number((product as any).boxKg || item.boxKg || 0),
        boxM3: Number((product as any).boxM3 || item.boxM3 || 0),
        thumbnailUrl: previewImg,
      }),
    })
    toast({
      title: "Item updated",
      description: `${item.name} — ${[selColor, selThickness, selSize].filter(Boolean).join(", ")}`,
    })
    closeOnce()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Compact modal (~half of previous), with product photo */}
      <DialogContent className="max-w-[560px] md:max-w-[640px] p-4 md:p-5">
        <DialogHeader>
          <DialogTitle className="text-base">Edit item</DialogTitle>
        </DialogHeader>

        {!item || loading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border">
                <Image src={previewImg || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.category} · {item.sub}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Size */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-size">Size</Label>
                <Select value={selSize || undefined} onValueChange={setSelSize}>
                  <SelectTrigger id="edit-size" className="h-9">
                    <SelectValue placeholder={item.size ? item.size : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(sizes.length ? sizes : [item.size]).filter(Boolean).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Thickness */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-thickness">Thickness</Label>
                <Select value={selThickness || undefined} onValueChange={setSelThickness}>
                  <SelectTrigger id="edit-thickness" className="h-9">
                    <SelectValue placeholder={item.thickness ? item.thickness : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(thicknesses.length ? thicknesses : [item.thickness]).filter(Boolean).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-color">Color</Label>
                <Select value={selColor || undefined} onValueChange={setSelColor}>
                  <SelectTrigger id="edit-color" className="h-9">
                    <SelectValue placeholder={item.color ? item.color : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(colors.length ? colors : [item.color]).filter(Boolean).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={closeOnce}>
            Cancel
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={confirm}>
            Confirm Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
