import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// In-memory fallback when Supabase env is not configured
const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
const memoryStore: { ui_translations?: Record<string, Record<string, { value: string; status?: "machine" | "reviewed" }>> } =
  // @ts-expect-error attach global for dev fallback
  (globalThis.__UI_TRANSLATIONS__ = globalThis.__UI_TRANSLATIONS__ || {})

function ok(data: any) {
  return NextResponse.json({ success: true, data })
}

function fail(message: string, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status })
}

// Shape:
// GET -> { translations: { [key]: { [lang]: { value, status } } } }
export async function GET() {
  try {
    if (!hasSupabase) {
      const translations = memoryStore.ui_translations || {}
      return ok({ translations })
    }

    const supabase = createClient()
    // Use site_settings table to store a single json blob under key="ui_translations"
    const { data, error } = await supabase.from("site_settings").select("data").eq("key", "ui_translations").single()
    if (error && error.code !== "PGRST116") throw error
    const translations = (data?.data as any)?.translations || (data?.data as any) || {}
    return ok({ translations })
  } catch (e: any) {
    return fail(e?.message || "Failed to load translations")
  }
}

// PUT body: { translations: { [key]: { [lang]: { value, status } } } }
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const incoming = (body?.translations || {}) as Record<string, Record<string, { value: string; status?: "machine" | "reviewed" }>>

    if (!hasSupabase) {
      const current = memoryStore.ui_translations || {}
      // shallow merge per key/lang
      const next: typeof current = { ...current }
      for (const k of Object.keys(incoming)) {
        next[k] = { ...(next[k] || {}) }
        for (const lang of Object.keys(incoming[k] || {})) {
          next[k][lang] = { ...(next[k][lang] || {}), ...(incoming[k][lang] || {}) }
        }
      }
      memoryStore.ui_translations = next
      return ok({})
    }

    const supabase = createClient()
    // Read existing
    const { data, error } = await supabase.from("site_settings").select("data").eq("key", "ui_translations").single()
    if (error && error.code !== "PGRST116") throw error
    const current = (data?.data as any)?.translations || (data?.data as any) || {}

    // merge
    const next: typeof current = { ...current }
    for (const k of Object.keys(incoming)) {
      next[k] = { ...(next[k] || {}) }
      for (const lang of Object.keys(incoming[k] || {})) {
        next[k][lang] = { ...(next[k][lang] || {}), ...(incoming[k][lang] || {}) }
      }
    }

    const upsert = { key: "ui_translations", data: { translations: next }, updated_at: new Date().toISOString() }
    const { error: upErr } = await supabase.from("site_settings").upsert(upsert, { onConflict: "key" })
    if (upErr) throw upErr

    return ok({})
  } catch (e: any) {
    return fail(e?.message || "Failed to save translations")
  }
}