import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
const memStore: Record<string, any[]> = (globalThis as any).__memPageBlocks || ((globalThis as any).__memPageBlocks = {})

async function resolvePageId(supabase: any, idOrKey: string) {
  const asNum = Number(idOrKey)
  if (!Number.isNaN(asNum)) return asNum
  const { data } = await supabase.from("pages").select("id").eq("key", idOrKey).single()
  return data?.id || null
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  if (!hasEnv) {
    const list = memStore[params.id] || []
    return NextResponse.json({ blocks: list })
  }
  let pageId = await resolvePageId(supabase, params.id)
  if (!pageId) {
    // Fallback to memory export to avoid UI errors
    const list = memStore[params.id] || []
    return NextResponse.json({ blocks: list, memory: true })
  }
  const { data: blocks } = await supabase
    .from("page_blocks")
    .select("id, type, props, slot, position, is_active, locale, valid_from, valid_to")
    .eq("page_id", pageId)
    .order("position", { ascending: true })
  return NextResponse.json({ blocks: blocks || [] })
}


