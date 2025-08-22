import { Truck, Shield, Zap, Award, Users, Globe } from "lucide-react"
import type { AdvantagesBlockData } from "@/lib/types"

interface AdvantagesBlockProps {
  data?: AdvantagesBlockData
}

const iconMap: Record<string, any> = {
  "🚚": Truck,
  "🛡️": Shield,
  "⚡": Zap,
  "🏆": Award,
  "👥": Users,
  "🌍": Globe,
  "⭐": Award,
  "💡": Zap,
  "🎯": Award,
}

export function AdvantagesBlock({ data }: AdvantagesBlockProps) {
  const defaultAdvantages = [
    {
      id: "1",
      icon: "🚚",
      title: "Fast Delivery",
      description: "Quick shipping worldwide with tracking and insurance included",
    },
    {
      id: "2",
      icon: "🛡️",
      title: "Premium Quality",
      description: "High-grade materials with 5-year warranty on all products",
    },
    {
      id: "3",
      icon: "⚡",
      title: "Easy Installation",
      description: "No tools required - just peel, stick, and transform your space",
    },
    {
      id: "4",
      icon: "🏆",
      title: "Wholesale Pricing",
      description: "Best prices for bulk orders with flexible payment terms",
    },
    {
      id: "5",
      icon: "👥",
      title: "B2B Support",
      description: "Dedicated account managers for business customers",
    },
    {
      id: "6",
      icon: "🌍",
      title: "Global Reach",
      description: "Serving customers in 50+ countries with local support",
    },
  ]

  const defaultData: AdvantagesBlockData = {
    title: "Why Choose Stick'N'Style?",
    subtitle: "We provide premium wall panel solutions with unmatched service and support",
    advantages: defaultAdvantages,
    visible: true,
  }

  const blockData = data || defaultData

  if (!blockData.visible) return null

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 lg:text-4xl mb-4">{blockData.title}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{blockData.subtitle}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blockData.advantages.map((advantage) => {
            const Icon = iconMap[advantage.icon] || Award
            return (
              <div
                key={advantage.id}
                className="group p-6 rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
                      {typeof advantage.icon === "string" && advantage.icon.length === 1 ? (
                        <span className="text-xl">{advantage.icon}</span>
                      ) : (
                        <Icon className="h-6 w-6 text-orange-600" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{advantage.title}</h3>
                    <p className="text-gray-600">{advantage.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
