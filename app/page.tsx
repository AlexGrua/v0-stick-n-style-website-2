import { HeroBlock } from "@/components/home/hero-block"
import { AdvantagesBlock } from "@/components/home/advantages-block"
import { ProductGalleryBlock } from "@/components/home/product-gallery-block"
import { CooperationBlock } from "@/components/home/cooperation-block"
import { CustomBlock } from "@/components/home/custom-block"
import { SiteFooter } from "@/components/site-footer"
import { db, seed } from "@/lib/db"

async function getHomePageData() {
  try {
    const state = db()

    if (!state.seeded) {
      seed()
    }

    return state.homePage
  } catch (error) {
    console.error("Failed to load home page data:", error)
    return null
  }
}

export default async function HomePage() {
  const homePageData = await getHomePageData()

  if (!homePageData) {
    return (
      <div className="min-h-screen bg-white">
        <main className="space-y-0">
          <HeroBlock />
          <AdvantagesBlock />
          <ProductGalleryBlock />
          <CooperationBlock />
        </main>
        <SiteFooter />
      </div>
    )
  }

  const customBlocks = homePageData.customBlocks || []

  const allBlocks = [
    { type: "hero", data: homePageData.hero, order: 1 },
    { type: "advantages", data: homePageData.advantages, order: 2 },
    { type: "productGallery", data: homePageData.productGallery, order: 3 },
    { type: "cooperation", data: homePageData.cooperation, order: 4 },
    ...customBlocks.map((block: any) => ({ type: "custom", data: block, order: block.order || 5 })),
  ].sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-white">
      <main className="space-y-0">
        {allBlocks.map((block, index) => {
          if (!block.data || !block.data.visible) return null

          switch (block.type) {
            case "hero":
              return <HeroBlock key={`hero-${index}`} data={block.data} />
            case "advantages":
              return <AdvantagesBlock key={`advantages-${index}`} data={block.data} />
            case "productGallery":
              return <ProductGalleryBlock key={`gallery-${index}`} data={block.data} />
            case "cooperation":
              return <CooperationBlock key={`cooperation-${index}`} data={block.data} />
            case "custom":
              return <CustomBlock key={`custom-${block.data.id || index}`} data={block.data} />
            default:
              return null
          }
        })}
      </main>

      <SiteFooter />
    </div>
  )
}
