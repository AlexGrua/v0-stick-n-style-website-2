import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Puzzle } from "lucide-react"
import type { HeroBlockData } from "@/lib/types"

interface HeroBlockProps {
  data?: HeroBlockData
}

export function HeroBlock({ data }: HeroBlockProps) {
  const defaultData: HeroBlockData = {
    title: "Premium Adhesive Wall Panels",
    subtitle: "Stick'N'Style",
    description:
      "Transform your space with our innovative stick-on wall panels. Easy installation, premium quality, wholesale pricing for professionals.",
    backgroundImage: "/modern-interior-3d-panels.png",
    ctaText: "Create Order Now",
    ctaLink: "/create-n-order",
    visible: true,
  }

  const blockData = data || defaultData

  if (!blockData.visible) return null

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Левая часть - текстовый контент */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 lg:text-5xl xl:text-6xl">
                {blockData.subtitle}
                <span className="block text-orange-600">{blockData.title}</span>
              </h1>
              <p className="text-lg text-gray-600 lg:text-xl">{blockData.description}</p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700" asChild>
                <Link href={blockData.ctaLink}>
                  <Puzzle className="mr-2 h-5 w-5" />
                  {blockData.ctaText}
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/catalog">Browse Catalog</Link>
              </Button>
            </div>
          </div>

          {/* Правая часть - изображение */}
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 shadow-2xl">
              <Image
                src={blockData.backgroundImage || "/modern-interior-3d-panels.png"}
                alt="Modern interior with premium wall panels"
                fill
                className="object-cover"
                priority
              />
            </div>
            {/* Декоративные элементы */}
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-orange-100 opacity-60" />
            <div className="absolute -top-4 -left-4 h-16 w-16 rounded-full bg-blue-100 opacity-60" />
          </div>
        </div>
      </div>
    </section>
  )
}
