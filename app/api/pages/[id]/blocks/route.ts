import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/api/guard"
import DOMPurify from "isomorphic-dompurify"

const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
const memStore: Record<string, any[]> = (globalThis as any).__memPageBlocks || ((globalThis as any).__memPageBlocks = {})

async function resolvePageId(supabase: any, idOrKey: string) {
  const asNum = Number(idOrKey)
  if (!Number.isNaN(asNum)) return asNum
  const { data } = await supabase.from("pages").select("id").eq("key", idOrKey).single()
  return data?.id || null
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = createClient()
  const url = new URL(req.url)
  const draft = url.searchParams.get("draft") === "1"
  if (!hasEnv) {
    const list = memStore[resolvedParams.id] || []
    const filtered = draft ? list : list.filter((b: any) => b.is_active !== false)
    return NextResponse.json({ blocks: filtered.map((b: any) => ({ 
      id: b.id, 
      type: b.type, 
      props: b.props,
      position: b.position,
      is_active: b.is_active,
      slot: b.slot || 'main'
    })) })
  }
  const pageId = await resolvePageId(supabase, resolvedParams.id)
  if (!pageId) {
    const list = memStore[resolvedParams.id] || []
    const filtered = draft ? list : list.filter((b: any) => b.is_active !== false)
    return NextResponse.json({ blocks: filtered.map((b: any) => ({ 
      id: b.id, 
      type: b.type, 
      props: b.props,
      position: b.position,
      is_active: b.is_active,
      slot: b.slot || 'main'
    })) })
  }
  let q = supabase
    .from("page_blocks")
    .select("id, type, props, slot, position, is_active, locale")
    .eq("page_id", pageId)
    .order("position", { ascending: true })
  if (!draft) q = q.eq("is_active", true)
  const { data } = await q
  return NextResponse.json({ blocks: (data || []).map((b: any) => ({ 
    id: b.id, 
    type: b.type, 
    props: b.props,
    position: b.position,
    is_active: b.is_active,
    slot: b.slot || 'main'
  })) })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const guard = requireRole(req, "admin")
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status })
  const supabase = createClient()
  const body = await req.json().catch(() => ({}))
  const incomingVersion = Number(req.headers.get("if-match") || body.version || 0)
  if (!hasEnv) {
    const blocks = Array.isArray(body.blocks) ? body.blocks : []
    const cleaned = blocks.map((b: any, i: number) => ({
      id: b.id || `${Date.now()}-${i}`,
      type: b.type,
      props: typeof b.props?.html === 'string' ? { ...b.props, html: DOMPurify.sanitize(b.props.html) } : (b.props || {}),
      slot: b.slot || 'main',
      position: typeof b.position === 'number' ? b.position : i * 10,
      is_active: b.is_active ?? true,
      locale: b.locale || null,
    }))
    memStore[resolvedParams.id] = cleaned
    return NextResponse.json({ ok: true, version: (incomingVersion || 1) + 1, writes: cleaned.length })
  }
  let pageId = await resolvePageId(supabase, resolvedParams.id)
  if (!pageId) {
    const key = resolvedParams.id
    const { data: created } = await supabase.from("pages").insert({ key }).select("id").single()
    pageId = created?.id || null
  }
  if (!pageId) return NextResponse.json({ error: "Page not found" }, { status: 404 })

  const { data: maxv } = await supabase
    .from("page_blocks")
    .select("version")
    .eq("page_id", pageId)
    .order("version", { ascending: false })
    .limit(1)
  const currentVersion = maxv && maxv.length ? maxv[0].version : 1
  if (incomingVersion && incomingVersion < currentVersion) {
    return NextResponse.json({ error: "Version conflict", currentVersion }, { status: 409 })
  }

  const blocks = Array.isArray(body.blocks) ? body.blocks : []
  const cleaned = blocks.map((b: any) => {
    const props = { ...(b.props || {}) }
    if (typeof props.html === "string") props.html = DOMPurify.sanitize(props.html)
    return { ...b, props }
  })

  let writes = 0
  for (let i = 0; i < cleaned.length; i++) {
    const blk = cleaned[i]
    const payload = {
      page_id: pageId,
      type: blk.type,
      props: blk.props || {},
      slot: blk.slot || 'main',
      position: typeof blk.position === 'number' ? blk.position : i * 10,
      is_active: blk.is_active ?? true,
      locale: blk.locale || null,
      version: (currentVersion || 1) + 1,
    }
    if (blk.id) {
      await supabase.from("page_blocks").update(payload).eq("id", blk.id)
      writes++
    } else {
      await supabase.from("page_blocks").insert(payload)
      writes++
    }
  }

  // audit
  await supabase.from("audit_logs").insert({
    entity: 'page',
    entity_id: pageId,
    action: 'blocks.upsert',
    by: guard.email || 'admin',
    diff: { count: writes, version: (currentVersion || 1) + 1 },
  })

  return NextResponse.json({ ok: true, version: (currentVersion || 1) + 1, writes })
}


