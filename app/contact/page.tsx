import { SiteFooter } from "@/components/site-footer"
import { BlockRenderer } from "@/components/blocks/renderer"
import { getBlocks } from "@/lib/pages"

// Main Contact Page Component
export default async function ContactPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ newblocks?: string, draft?: string, layout?: string }> 
}) {
  const params = await searchParams
  
  // Check for feature flag or query parameter
  // Temporarily enable blocks by default for testing
  const useBlocks = true || process.env.NEXT_PUBLIC_FEATURE_BLOCK_CONTACTS === '1' || 
                   params?.newblocks === '1'

  // Render with blocks if feature flag is enabled
  if (useBlocks) {
    // Get blocks - use draft mode only for preview, otherwise published blocks
    const draftMode = params?.draft === '1'
    const blocks = await getBlocks('contact', { draft: draftMode })
    
    // Auto-detect two-column layout based on slots OR force with flag/parameter
    const hasSlots = blocks.some((b: any) => b.slot === 'left' || b.slot === 'right')
    const forceTwo = process.env.NEXT_PUBLIC_FEATURE_CONTACT_LAYOUT_V2 === '1' || 
                    params?.layout === '2col'
    const twoCol = hasSlots || forceTwo
    
    // Two-column layout
    if (twoCol) {
      const top = blocks.filter((b: any) => b.slot === 'top' || b.type === 'contactsHero')
      const left = blocks.filter((b: any) => b.slot === 'left')
      const right = blocks.filter((b: any) => b.slot === 'right')

      return (
        <div className="min-h-screen bg-white">
          <main className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
            <BlockRenderer blocks={top} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7">
                <BlockRenderer blocks={left} />
              </div>
              <aside className="lg:col-span-5 lg:sticky lg:top-24">
                <BlockRenderer blocks={right} />
              </aside>
            </div>
          </main>
          <SiteFooter />
        </div>
      )
    }
    
    // Single column layout
    return (
      <div className="min-h-screen bg-white">
        <main className="container mx-auto px-4 py-8">
          <BlockRenderer blocks={blocks} wrapperClass="block-renderer" />
        </main>
        <SiteFooter />
      </div>
    )
  }

  // Legacy render - fallback to blocks if legacy not available
  const blocks = await getBlocks('contact', { draft: false })
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <BlockRenderer blocks={blocks} wrapperClass="block-renderer" />
      </main>
      <SiteFooter />
    </div>
  )
}
