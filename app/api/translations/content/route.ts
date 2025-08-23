import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
const memoryStore: { content_translations?: Record<string, Record<string, Record<string, Record<string, { value: string; status?: "machine" | "reviewed" }>>>> } =
  // @ts-expect-error attach global for dev fallback
  (globalThis.__CONTENT_TRANSLATIONS__ = globalThis.__CONTENT_TRANSLATIONS__ || {})

function ok(data: any) {
  return NextResponse.json({ success: true, data })
}

function fail(message: string, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const entityType = url.searchParams.get("entityType") || undefined
    const entityId = url.searchParams.get("entityId") || undefined

    let current: Record<string, any> = {}
    if (!hasSupabase) {
      current = memoryStore.content_translations || {}
    } else {
      const supabase = createClient()
      const { data, error } = await supabase.from("site_settings").select("data").eq("key", "content_translations").single()
      if (error && error.code !== "PGRST116") throw error
      current = (data?.data as any) || {}
    }

    if (entityType && entityId) {
      const subset = current?.[entityType]?.[entityId] || {}
      return ok({ translations: subset })
    }

    return ok({ translations: current })
  } catch (e: any) {
    return fail(e?.message || "Failed to load content translations")
  }
}

// PUT body: { entityType: string, entityId: string, entries: { [fieldPath]: { [lang]: { value, status } } } }
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const entityType = String(body?.entityType || "").trim()
    const entityId = String(body?.entityId || "").trim()
    const entries = (body?.entries || {}) as Record<string, Record<string, { value: string; status?: string }>>
    if (!entityType || !entityId) return fail("entityType and entityId are required", 400)

    let current: Record<string, any> = {}
    if (!hasSupabase) {
      current = memoryStore.content_translations || {}
    } else {
      const supabase = createClient()
      const { data, error } = await supabase.from("site_settings").select("data").eq("key", "content_translations").single()
      if (error && error.code !== "PGRST116") throw error
      current = (data?.data as any) || {}
    }

    if (!current[entityType]) current[entityType] = {}
    if (!current[entityType][entityId]) current[entityType][entityId] = {}

    const base = current[entityType][entityId]
    for (const path of Object.keys(entries)) {
      base[path] = { ...(base[path] || {}), ...(entries[path] || {}) }
    }

    if (!hasSupabase) {
      memoryStore.content_translations = current
    } else {
      const supabase = createClient()
      const upsert = { key: "content_translations", data: current, updated_at: new Date().toISOString() }
      const { error: upErr } = await supabase.from("site_settings").upsert(upsert, { onConflict: "key" })
      if (upErr) throw upErr
    }

    return ok({})
  } catch (e: any) {
    return fail(e?.message || "Failed to save content translations")
  }
}
