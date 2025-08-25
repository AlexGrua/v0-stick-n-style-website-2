import "server-only"
import { unstable_cache as unstableCache, revalidateTag } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type PageBlockRow = {
  id: number
  type: string
  props: any
  slot: string
  position: number
  is_active: boolean
  locale: string | null
  valid_from: string | null
  valid_to: string | null
}

function nowIso() {
  return new Date().toISOString()
}

export const getBlocks = async (pageKey: string, opts?: { draft?: boolean; locale?: string }) => {
  const supabase = createClient()
  if ((supabase as any).from === undefined) return [] as any[]

  const { data: page } = await supabase.from("pages").select("id").eq("key", pageKey).single()
  if (!page) return []

  const locale = opts?.locale || null
  
  // If not draft mode, check for latest publication
  if (!opts?.draft) {
    try {
      const { data: publication } = await supabase
        .from("page_publications")
        .select("blocks")
        .eq("page_id", page.id)
        .order("published_at", { ascending: false })
        .limit(1)
        .single()
      
      if (publication?.blocks) {
        // Return published blocks
        return publication.blocks.map((b: any) => ({ 
          id: b.id, 
          type: b.type, 
          props: b.props, 
          slot: b.slot, 
          position: b.position 
        }))
      }
    } catch (error) {
      console.log('No publication found, falling back to draft mode')
    }
  }
  
  // Fallback to draft mode or if no publication exists
  let q = supabase
    .from("page_blocks")
    .select("id, type, props, slot, position, is_active, locale, valid_from, valid_to")
    .eq("page_id", page.id)
    .order("position", { ascending: true })

  if (!opts?.draft) q = q.eq("is_active", true)

  const { data: rows } = await q
  const list = (rows || []) as PageBlockRow[]
  // Locale fallback: prefer exact match, then NULL
  const filtered = list.filter((b) => !locale || b.locale === locale || b.locale === null)
  // Valid window
  const now = nowIso()
  const inWindow = filtered.filter((b) => (!b.valid_from || b.valid_from <= now) && (!b.valid_to || b.valid_to >= now))
  return inWindow.map((b) => ({ 
    id: b.id, 
    type: b.type, 
    props: b.props, 
    slot: b.slot || 'main', 
    position: b.position 
  }))
}

export function revalidatePage(pageKey: string) {
  revalidateTag(`page:${pageKey}`)
}


