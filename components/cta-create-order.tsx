"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Puzzle, FileDown } from "lucide-react"
import Link from "next/link"

export function CtaCreateOrder() {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_1fr] md:items-center">
        <div className="max-w-2xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-emerald-700">
            <Puzzle className="h-4 w-4" />
            Build your own style
          </div>
          <h3 className="text-xl font-semibold">Create an Order in 1 Click</h3>
          <p className="text-sm text-muted-foreground">
            Add multiple items fast, track boxes/kg/m³, and export to PDF / Excel. Optimized for wholesale orders.
          </p>
          <div className="mt-4">
            <Button asChild className="shrink-0 bg-orange-600 hover:bg-orange-700">
              <Link href="/create-n-order">
                <Puzzle className="mr-2 h-4 w-4" />
                Create Now
              </Link>
            </Button>
          </div>
        </div>

        {/* Unified “How it works” mini-steps on the right */}
        <div className="grid gap-3">
          <div className="rounded-lg border p-3">
            <div className="text-sm font-semibold">1. Pick products</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse catalog, select categories, and set sizes, thickness, and colors.
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-sm font-semibold">2. Fill boxes</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Input boxes per SKU; see live totals for pcs, kg, and m³. The right panel is your cart.
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-sm font-semibold">3. Export & submit</div>
            <p className="mt-1 text-sm text-muted-foreground">
              <FileDown className="mr-1 inline h-4 w-4" />
              Download a PDF/CSV and submit your order to our sales team.
            </p>
          </div>
        </div>
      </CardContent>

      {/* Decorative grid */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 opacity-10 [mask-image:radial-gradient(circle,black,transparent)]">
        <div className="grid h-full w-full grid-cols-4 grid-rows-4 gap-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="flex items-center justify-center rounded border border-emerald-600/40">
              <Puzzle className="h-4 w-4 text-emerald-700" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
