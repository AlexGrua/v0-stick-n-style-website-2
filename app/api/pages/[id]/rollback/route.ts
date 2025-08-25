import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/api/guard"
import { revalidatePage } from "@/lib/pages"

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
  let pageId = await resolvePageId(supabase, params.id)
  if (!pageId) {
    const key = params.id
    const { data: created } = await supabase.from("pages").insert({ key }).select("id").single()
    pageId = created?.id || null
  }
  if (!pageId) return NextResponse.json({ error: "Page not found" }, { status: 404 })

  const { data: pub } = await supabase
    .from("page_publications")
    .select("version, snapshot")
    .eq("page_id", pageId)
    .order("published_at", { ascending: false })
    .limit(2)

  if (!pub || pub.length < 2) return NextResponse.json({ error: "No previous publication" }, { status: 400 })
  const prev = pub[1]

  await supabase.from("page_blocks").update({ is_active: false }).eq("page_id", pageId)
  const snapshot = (prev.snapshot as any[]) || []
  for (let i = 0; i < snapshot.length; i++) {
    const b = snapshot[i]
    await supabase.from("page_blocks").insert({
      page_id: pageId,
      type: b.type,
      props: b.props || {},
      slot: b.slot || 'main',
      position: typeof b.position === 'number' ? b.position : i * 10,
      is_active: true,
      version: prev.version + 1,
    })
  }

  await supabase.from("audit_logs").insert({
    entity: 'page',
    entity_id: pageId,
    action: 'page.rollback',
    by: guard.email || 'admin',
    diff: { restoredVersion: prev.version, count: snapshot.length },
  })

  revalidatePage(typeof pageId === 'number' ? 'home' : params.id)
  return NextResponse.json({ ok: true, restoredVersion: prev.version })
}


