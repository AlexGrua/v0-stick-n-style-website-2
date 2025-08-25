// Backfill current Home in-memory content into page_blocks
// Usage: node scripts/backfill-home-blocks.ts

import { createClient } from "@/lib/supabase/server"
import { defaultHome } from "@/lib/home-content"

async function main() {
  // @ts-ignore server runtime only
  const supabase = createClient()
  const home = defaultHome()

  const { data: page } = await supabase.from("pages").select("id").eq("key", "home").single()
  if (!page) {
    throw new Error("Page 'home' not found. Run migration seed first.")
  }

  // Disable current active
  await supabase.from("page_blocks").update({ is_active: false }).eq("page_id", page.id)

  // Insert blocks mapped to existing UI: hero -> hero, categoryGrid -> productGrid, about -> features, footerCta -> features(optional)
  const mapType = (t: string) => {
    if (t === "categoryGrid") return "productGrid"
    if (t === "about") return "features"
    return t
  }

  const blocks = home.blocks
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((b, i) => ({ type: mapType(b.type), props: b.data, position: i * 10 }))

  for (const b of blocks) {
    await supabase.from("page_blocks").insert({
      page_id: page.id,
      type: b.type,
      props: b.props || {},
      slot: "main",
      position: b.position,
      is_active: true,
    })
  }

  console.log("Backfill completed: ", blocks.length, "blocks")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})



