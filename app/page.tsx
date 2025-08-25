import { SiteFooter } from "@/components/site-footer"
import { HeroBlock } from "@/components/home/hero-block"
import { AdvantagesBlock } from "@/components/home/advantages-block"
import { ProductGalleryBlock } from "@/components/home/product-gallery-block"
import { CooperationBlock } from "@/components/home/cooperation-block"
import { CustomBlock } from "@/components/home/custom-block"
import { getHomePageData } from "@/lib/db"
import { getBlocks } from "@/lib/pages"
import { BlockRenderer } from "@/components/blocks/renderer"

export default async function HomePage() {
  // Временно отключаем новую блочную систему
  // const flag = process.env.FEATURE_BLOCK_HOME === "1"
  // const useBlocks = flag
  const useBlocks = false

  if (useBlocks) {
    const blocks = await getBlocks('home', { draft: false })
    return (
      <div className="min-h-screen bg-white">
        <main className="space-y-0">
          <BlockRenderer blocks={blocks as any} />
        </main>
        <SiteFooter />
      </div>
    )
  }

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

  const customBlocks = Array.isArray(homePageData.customBlocks) ? homePageData.customBlocks : []

  const blockOrder = homePageData.blockOrder || ["hero", "advantages", "productGallery", "cooperation"]

  const mainBlocks = blockOrder
    .map((blockType, index) => {
      const blockData = homePageData[blockType as keyof typeof homePageData]
      return { type: blockType, data: blockData, order: index + 1 }
    })
    .filter((block) => block.data && typeof block.data === "object")

  const allBlocks = [
    ...mainBlocks,
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
