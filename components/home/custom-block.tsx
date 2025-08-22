import { Button } from "@/components/ui/button"
import type { CustomBlockData } from "@/lib/types"

interface CustomBlockProps {
  data: CustomBlockData
}

export function CustomBlock({ data }: CustomBlockProps) {
  if (!data.visible) return null

  return (
    <section className="py-16 px-4 relative overflow-hidden">
      {/* Background Image */}
      {data.backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${data.backgroundImage})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white">{data.title}</h2>
            <p className="text-xl text-orange-100">{data.subtitle}</p>
          </div>

          <p className="text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">{data.description}</p>

          {data.ctaText && data.ctaLink && (
            <div className="pt-4">
              <Button
                asChild
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg font-semibold"
              >
                <a href={data.ctaLink}>{data.ctaText}</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
