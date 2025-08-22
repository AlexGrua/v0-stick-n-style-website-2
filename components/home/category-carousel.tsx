"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type CategoryItem = {
  id: string
  name: string
  href?: string
  image?: string
}

export default function CategoryCarousel({
  items = [],
  perPage = 4,
}: {
  items?: CategoryItem[]
  perPage?: number
}) {
  const [page, setPage] = React.useState(0)
  const pages = Math.ceil((items?.length || 0) / perPage) || 1
  const start = page * perPage
  const visible = items.slice(start, start + perPage)

  function next() {
    setPage((p) => (p + 1 < pages ? p + 1 : 0))
  }
  function prev() {
    setPage((p) => (p - 1 >= 0 ? p - 1 : pages - 1))
  }

  return (
    <div className="relative">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((c) => (
          <Link key={c.id} href={c.href || "/catalog"} className="group">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={
                      c.image ||
                      `/placeholder.svg?height=600&width=800&query=${encodeURIComponent("Category " + (c.name || ""))}`
                    }
                    alt={c.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0 opacity-70 transition-opacity group-hover:opacity-60" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="inline-flex items-center gap-2 rounded-md bg-white/90 px-3 py-1 text-sm font-medium text-emerald-700">
                      {c.name}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {items.length > perPage && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={prev}
            className="absolute -left-2 top-1/2 hidden -translate-y-1/2 rounded-full border bg-white p-1 shadow sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={next}
            className="absolute -right-2 top-1/2 hidden -translate-y-1/2 rounded-full border bg-white p-1 shadow sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  )
}
