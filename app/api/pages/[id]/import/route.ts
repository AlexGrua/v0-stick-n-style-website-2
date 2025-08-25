import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/api/guard"

const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
const memStore: Record<string, any[]> = (globalThis as any).__memPageBlocks || ((globalThis as any).__memPageBlocks = {})

async function resolvePageId(supabase: any, idOrKey: string) {
  const asNum = Number(idOrKey)
  if (!Number.isNaN(asNum)) return asNum
  const { data } = await supabase.from("pages").select("id").eq("key", idOrKey).single()
  return data?.id || null
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = requireRole(req, "admin")
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status })
  const supabase = createClient()
  const body = await req.json().catch(() => ({}))
  const items = Array.isArray(body.blocks) ? body.blocks : []
  if (!hasEnv) {
    memStore[params.id] = items
    return NextResponse.json({ ok: true, imported: items.length, memory: true })
  }
  const pageId = await resolvePageId(supabase, params.id)
  if (!pageId) return NextResponse.json({ error: "Page not found" }, { status: 404 })

  await supabase.from("page_blocks").update({ is_active: false }).eq("page_id", pageId)
  for (let i = 0; i < items.length; i++) {
    const b = items[i]
    await supabase.from("page_blocks").insert({
      page_id: pageId,
      type: b.type,
      props: b.props || {},
      slot: b.slot || 'main',
      position: typeof b.position === 'number' ? b.position : i * 10,
      is_active: b.is_active ?? true,
      locale: b.locale || null,
    })
  }

  await supabase.from("audit_logs").insert({
    entity: 'page',
    entity_id: pageId,
    action: 'blocks.import',
    by: guard.email || 'admin',
    diff: { count: items.length },
  })

  return NextResponse.json({ ok: true, imported: items.length })
}


