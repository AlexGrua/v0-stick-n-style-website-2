import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, Users, Handshake, TrendingUp } from "lucide-react"
import type { CooperationBlockData } from "@/lib/types"

interface CooperationBlockProps {
  data?: CooperationBlockData
}

const cooperationFeatures = [
  {
    icon: Users,
    title: "Dedicated Account Manager",
    description: "Personal support for all your business needs",
  },
  {
    icon: TrendingUp,
    title: "Volume Discounts",
    description: "Better pricing for larger orders and regular customers",
  },
  {
    icon: Handshake,
    title: "Flexible Payment Terms",
    description: "Net 30/60 payment options for established partners",
  },
  {
    icon: CheckCircle,
    title: "Quality Guarantee",
    description: "100% satisfaction guarantee on all bulk orders",
  },
]

export function CooperationBlock({ data }: CooperationBlockProps) {
  const defaultData: CooperationBlockData = {
    title: "Partner with Stick'N'Style",
    subtitle: "Join our network of successful partners",
    description:
      "Join our network of successful partners and grow your business with premium wall panel solutions. We provide comprehensive support to help you succeed in the market.",
    backgroundImage: "/wood-flooring-textures.png",
    ctaText: "Become a Partner",
    ctaLink: "/contact",
    visible: true,
  }

  const blockData = data || defaultData

  if (!blockData.visible) return null

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Левая часть - контент */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900 lg:text-4xl">{blockData.title}</h2>
              <p className="text-lg text-gray-600">{blockData.description}</p>
            </div>

            {/* Список преимуществ сотрудничества */}
            <div className="grid gap-6 sm:grid-cols-2">
              {cooperationFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Icon className="h-6 w-6 text-orange-600 mt-1" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Дополнительная информация */}
            <div className="bg-orange-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">What We Offer Our Partners:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-orange-600 mr-2 flex-shrink-0" />
                  Marketing materials and product samples
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-orange-600 mr-2 flex-shrink-0" />
                  Technical training and installation support
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-orange-600 mr-2 flex-shrink-0" />
                  Exclusive territory rights for qualified partners
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-orange-600 mr-2 flex-shrink-0" />
                  Co-op advertising and promotional support
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700" asChild>
                <Link href={blockData.ctaLink}>{blockData.ctaText}</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>

          {/* Правая часть - изображение */}
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 shadow-xl">
              <Image
                src={blockData.backgroundImage || "/wood-flooring-textures.png"}
                alt="Business partnership and cooperation"
                fill
                className="object-cover"
              />
            </div>
            {/* Статистика */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">500+</div>
                <div className="text-sm text-gray-600">Happy Partners</div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">50+</div>
                <div className="text-sm text-gray-600">Countries</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
