import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Product } from "@/lib/types"
import { ProductDetails } from "@/components/catalog/product-details"

async function getProduct(id: string): Promise<Product | null> {
  const r = await fetch(`${typeof window === "undefined" ? "" : ""}/api/products/${id}`, { cache: "no-store" })
  if (!r.ok) return null
  return r.json()
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)

  if (!product) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад в каталог
        </Link>
        <div className="mt-6 text-sm text-muted-foreground">Product not found.</div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Link
        href="/catalog"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад в каталог
      </Link>

      <section className="mt-6">
        <ProductDetails product={product} />
      </section>
    </main>
  )
}
