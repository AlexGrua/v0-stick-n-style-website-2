import Image from "next/image"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent } from "@/components/ui/card"
import { CtaCreateOrder } from "@/components/cta-create-order"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header is provided by root layout. Do not render here. */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold">About Stick&apos;N&apos;Style</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          We are a B2B supplier of 3D wall panels, flooring, and adhesive solutions. Our goal is to make bulk ordering
          simple, accurate, and export‑ready. From product configuration to container planning, we focus on clarity and
          speed.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="grid gap-3 p-4">
              <h2 className="text-lg font-semibold">Our approach</h2>
              <p className="text-sm text-muted-foreground">
                Ergonomics first. We streamline tables, inputs, and exports to fit wholesale workflows. Totals for
                boxes, pcs, kg, and m³ are always visible.
              </p>
            </CardContent>
          </Card>
          <div className="relative h-56 rounded-lg border">
            <Image
              src="/modern-interior-3d-panels.png"
              alt="Our products in modern interior"
              fill
              className="rounded-lg object-cover"
            />
          </div>
        </div>

        {/* Unified CTA same as Home */}
        <div className="mt-10">
          <CtaCreateOrder />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
