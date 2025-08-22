"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Product } from "@/lib/types"
import { ProductDetails } from "./product-details"
import { useToast } from "@/hooks/use-toast"

export function QuickView({
  open,
  onOpenChange,
  product,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  product: Product | null
}) {
  const { toast } = useToast()

  const handleAdded = () => {
    // Show a simple confirmation toast and close the quick view.
    toast({
      title: "Added to Cart",
      description: "Item has been added to your cart.",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-[1280px] lg:max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Product</DialogTitle>
        </DialogHeader>
        {product ? (
          <ProductDetails product={product} onAdded={handleAdded} />
        ) : (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
