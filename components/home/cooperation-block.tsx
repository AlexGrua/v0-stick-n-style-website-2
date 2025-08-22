import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, Users, Handshake, TrendingUp } from "lucide-react"
import type { CooperationBlockData } from "@/lib/types"

interface CooperationBlockProps {
  data?: CooperationBlockData
}

const iconMap: Record<string, any> = {
  "👥": Users,
  "📈": TrendingUp,
  "🤝": Handshake,
  "✅": CheckCircle,
}

export function CooperationBlock({ data }: CooperationBlockProps) {
  const defaultData: CooperationBlockData = {
    title: "Partner with Stick'N'Style",
    subtitle: "Join our network of successful partners",
    description:
      "Join our network of successful partners and grow your business with premium wall panel solutions. We provide comprehensive support to help you succeed in the market.",
    backgroundImage: "/wood-flooring-textures.png",
    features: [], // пустой массив - только динамические данные
    buttons: [], // пустой массив - только динамические данные
    ctaText: "Become a Partner",
    ctaLink: "/contact",
    visible: true,
  }

  const blockData = data || defaultData

  if (!blockData.visible) return null

  const imageToShow = blockData.uploadedImage || blockData.backgroundImage || "/wood-flooring-textures.png"

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

            {blockData.features && blockData.features.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2">
                {blockData.features.map((feature) => {
                  const Icon = iconMap[feature.icon] || CheckCircle
                  return (
                    <div key={feature.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {typeof feature.icon === "string" && feature.icon.length <= 2 ? (
                          <span className="text-2xl">{feature.icon}</span>
                        ) : (
                          <Icon className="h-6 w-6 text-orange-600 mt-1" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {blockData.buttons && blockData.buttons.length > 0 && (
              <div className="flex flex-col gap-4 sm:flex-row">
                {blockData.buttons.map((button) => (
                  <Button
                    key={button.id}
                    size="lg"
                    variant={button.variant === "secondary" ? "outline" : "default"}
                    className={button.variant === "primary" ? "bg-orange-600 hover:bg-orange-700" : ""}
                    asChild
                  >
                    <Link href={button.link}>{button.text}</Link>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Правая часть - изображение */}
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 shadow-xl">
              <Image
                src={imageToShow || "/placeholder.svg"}
                alt="Business partnership and cooperation"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
