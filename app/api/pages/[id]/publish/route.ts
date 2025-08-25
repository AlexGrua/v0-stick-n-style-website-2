import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/api/guard"
import { revalidateTag } from "next/cache"

async function resolvePageId(supabase: any, idOrKey: string) {
  const asNum = Number(idOrKey)
  if (!Number.isNaN(asNum)) return asNum
  const { data } = await supabase.from("pages").select("id").eq("key", idOrKey).single()
  return data?.id || null
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const guard = requireRole(req, "admin")
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status })

  const supabase = createClient()
  const body = await req.json().catch(() => ({}))

  let pageId = await resolvePageId(supabase, resolvedParams.id)
  if (!pageId) {
    const key = resolvedParams.id
    const { data: created } = await supabase.from("pages").insert({ key }).select("id").single()
    pageId = created?.id || null
  }
  if (!pageId) return NextResponse.json({ error: "Page not found" }, { status: 404 })

  try {
    // Get current version
    const { data: maxv } = await supabase
      .from("page_blocks")
      .select("version")
      .eq("page_id", pageId)
      .order("version", { ascending: false })
      .limit(1)
    const currentVersion = maxv && maxv.length ? maxv[0].version : 1
    const newVersion = currentVersion + 1

    // Create publication record
    const { error: pubError } = await supabase
      .from("page_publications")
      .insert({
        page_id: pageId,
        version: newVersion,
        snapshot: body.blocks || [],
        published_by: guard.user?.email || 'admin'
      })

    if (pubError) {
      console.error('Publication error:', pubError)
      return NextResponse.json({ error: "Failed to publish" }, { status: 500 })
    }

    // Revalidate cache
    revalidateTag(`page:${resolvedParams.id}`)

    return NextResponse.json({ 
      ok: true, 
      version: newVersion,
      message: "Page published successfully" 
    })

  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: "Failed to publish" }, { status: 500 })
  }
}


