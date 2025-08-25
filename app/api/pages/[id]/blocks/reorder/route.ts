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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = requireRole(req, "admin")
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status })
  const supabase = createClient()
  const body = await req.json().catch(() => ({}))
  const items = Array.isArray(body.items) ? body.items : []
  if (!hasEnv) {
    const list = (memStore[params.id] || []).slice()
    const positions: Record<string, number> = {}
    for (let i = 0; i < items.length; i++) positions[items[i].id] = i * 10
    const reordered = list
      .map((b: any) => ({ ...b, position: positions[b.id] ?? b.position }))
      .sort((a: any, b: any) => a.position - b.position)
    memStore[params.id] = reordered
    return NextResponse.json({ items: reordered.map((b: any) => ({ id: b.id, position: b.position })) })
  }
  let pageId = await resolvePageId(supabase, params.id)
  if (!pageId) {
    const key = params.id
    const { data: created } = await supabase.from("pages").insert({ key }).select("id").single()
    pageId = created?.id || null
  }
  if (!pageId) return NextResponse.json({ error: "Page not found" }, { status: 404 })

  for (let i = 0; i < items.length; i++) {
    const id = items[i].id
    const pos = i * 10
    await supabase.from("page_blocks").update({ position: pos }).eq("id", id).eq("page_id", pageId)
  }

  const { data } = await supabase
    .from("page_blocks")
    .select("id, position")
    .eq("page_id", pageId)
    .order("position", { ascending: true })

  await supabase.from("audit_logs").insert({
    entity: 'page',
    entity_id: pageId,
    action: 'blocks.reorder',
    by: guard.email || 'admin',
    diff: { count: items.length },
  })

  return NextResponse.json({ items: data || [] })
}


