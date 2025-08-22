"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { CtaCreateOrder } from "@/components/cta-create-order"
import { SiteFooter } from "@/components/site-footer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { QuickView } from "@/components/catalog/quick-view"
import type { Category, Product } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function CatalogPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [expandedCats, setExpandedCats] = React.useState<string[]>([])
  const [expandedSubs, setExpandedSubs] = React.useState<Record<string, boolean>>({})
  const [quickView, setQuickView] = React.useState<Product | null>(null)

  // Center filters
  const [search, setSearch] = React.useState("")
  const [activeCat, setActiveCat] = React.useState<string>("all")
  const [activeSub, setActiveSub] = React.useState<string>("All")

  React.useEffect(() => {
    Promise.all([fetch("/api/categories"), fetch("/api/products?limit=10000")])
      .then(async ([c, p]) => [await c.json(), await p.json()])
      .then(([c, p]: any) => {
        setCategories(c.items || [])
        setProducts(p.items || [])
      })
      .catch(() => {})
  }, [])

  const allSubsForActiveCat = React.useMemo(() => {
    if (activeCat === "all") return []
    const cat = categories.find((c) => c.slug === activeCat)
    const names = (cat?.subs || []).map((s) => s.name)
    return ["All", ...names]
  }, [categories, activeCat])

  const filteredProducts = React.useMemo(() => {
    return (products || []).filter((p) => {
      const s = p.name.toLowerCase().includes(search.toLowerCase())
      const c = activeCat === "all" ? true : p.category === activeCat
      const sub = activeCat === "all" || activeSub === "All" ? true : p.sub === activeSub
      return s && c && sub
    })
  }, [products, search, activeCat, activeSub])

  function toggleCat(slug: string) {
    setExpandedCats((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]))
  }
  function toggleSub(key: string) {
    setExpandedSubs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header is provided by root layout. Do not render here. */}
      <main className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-[320px_1fr]">
        {/* Left: Category → Subcategory → Products */}
        <div>
          <Accordion type="multiple" value={expandedCats}>
            {categories.map((cat) => {
              const subs = cat.subs || []
              // Map products by sub
              const prodsBySub = new Map<string, Product[]>()
              subs.forEach((s) => prodsBySub.set(s.name, []))
              products.forEach((p) => {
                if (p.category !== cat.slug) return
                const subName = p.sub || "General"
                if (!prodsBySub.has(subName)) prodsBySub.set(subName, [])
                prodsBySub.get(subName)!.push(p)
              })

              return (
                <AccordionItem key={cat.id} value={cat.slug} className="border-b">
                  <AccordionTrigger onClick={() => toggleCat(cat.slug)} className="text-base">
                    {cat.name}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {Array.from(prodsBySub.entries()).map(([subName, prods]) => {
                        const key = `${cat.slug}:${subName}`
                        const openSub = !!expandedSubs[key]
                        return (
                          <div key={key} className="rounded border">
                            <button
                              onClick={() => toggleSub(key)}
                              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
                              aria-expanded={openSub}
                            >
                              <span>{subName}</span>
                              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs">
                                {prods.length}
                              </span>
                            </button>
                            {openSub ? (
                              <div className="divide-y max-h-80 overflow-auto pr-1">
                                {prods.map((p) => (
                                  <button
                                    key={p.id}
                                    className="grid w-full grid-cols-[40px_1fr] items-center gap-2 px-2 py-1.5 text-left hover:bg-muted/40"
                                    onClick={() => setQuickView(p)}
                                    aria-label={`Open ${p.name}`}
                                    title={p.name}
                                  >
                                    <div className="relative h-10 w-10 overflow-hidden rounded border">
                                      <Image
                                        src={
                                          p.thumbnailUrl ||
                                          "/placeholder.svg?height=80&width=80&query=product%20thumbnail" ||
                                          "/placeholder.svg" ||
                                          "/placeholder.svg"
                                        }
                                        alt={`${p.name} thumbnail`}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="truncate text-[13px] font-medium leading-tight">{p.name}</div>
                                      <div className="truncate text-[11px] text-muted-foreground leading-tight">
                                        {(p.sizes || []).slice(0, 2).join(", ")}
                                        {p.sizes && p.sizes.length > 2 ? "…" : ""}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
            {categories.length === 0 ? (
              <Card className="grid place-items-center p-6 text-sm text-muted-foreground">No categories</Card>
            ) : null}
          </Accordion>
        </div>

        {/* Right: central filters and product grid */}
        <div className="min-w-0">
          {/* Filters bar */}
          <div className="rounded-lg border p-3">
            <div className="grid gap-3">
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search products"
              />
              {/* Categories row */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setActiveCat("all")
                    setActiveSub("All")
                  }}
                  className={cn(
                    "rounded border px-3 py-1 text-sm",
                    activeCat === "all" && "bg-emerald-50 ring-2 ring-emerald-600",
                  )}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveCat(c.slug)
                      setActiveSub("All")
                    }}
                    className={cn(
                      "rounded border px-3 py-1 text-sm",
                      activeCat === c.slug && "bg-emerald-50 ring-2 ring-emerald-600",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              {/* Subs row */}
              {activeCat !== "all" && (
                <div className="flex flex-wrap gap-2">
                  {allSubsForActiveCat.map((s) => (
                    <button
                      key={s}
                      onClick={() => setActiveSub(s)}
                      className={cn(
                        "rounded border px-3 py-1 text-sm",
                        activeSub === s && "bg-emerald-50 ring-2 ring-emerald-600",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product grid */}
          <section className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((p) => (
              <div key={p.id} className="rounded-lg border overflow-hidden">
                <Link href={`/catalog/${p.id}`} className="block">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={p.thumbnailUrl || "/placeholder.svg?height=600&width=800&query=product%20image"}
                      alt={p.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="px-3 pt-3">
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                    <div className="mb-2 text-xs text-muted-foreground">
                      {p.category} · {p.sub}
                    </div>
                  </div>
                </Link>
                <div className="px-3 pb-3">
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => setQuickView(p)} // open configurator instead of direct add
                    aria-label={`Configure and add ${p.name}`}
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 ? (
              <div className="col-span-full rounded border p-6 text-sm text-muted-foreground">
                No products match your filters.
              </div>
            ) : null}
          </section>

          {/* CTA */}
          <div className="mt-8">
            <CtaCreateOrder />
          </div>
        </div>
      </main>

      <SiteFooter />

      {/* Quick View for left list and grid button */}
      <QuickView open={!!quickView} onOpenChange={(v) => !v && setQuickView(null)} product={quickView} />
    </div>
  )
}
