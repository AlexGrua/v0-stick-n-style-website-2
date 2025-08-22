import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { translateBatch } from "@/lib/translator"

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
const memoryStore: { ui_translations?: Record<string, Record<string, { value: string; status?: "machine" | "reviewed" }>>; languages?: string[] } =
  // @ts-expect-error attach global for dev fallback
  (globalThis.__UI_TRANSLATIONS__ = globalThis.__UI_TRANSLATIONS__ || {})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const key = String(body?.key || "").trim()
    const en = String(body?.en || "").trim()
    if (!key || !en) return NextResponse.json({ success: false, error: "key and en are required" }, { status: 400 })

    // Load current translations
    let current: Record<string, Record<string, { value: string; status?: string }>> = {}
    let enabledLangs: string[] = []

    if (!hasSupabase) {
      current = memoryStore.ui_translations || {}
      enabledLangs = (memoryStore.languages as any) || ["ru", "es", "cn"]
    } else {
      const supabase = createClient()
      const { data, error } = await supabase.from("site_settings").select("data").eq("key", "ui_translations").single()
      if (error && error.code !== "PGRST116") throw error
      current = (data?.data as any)?.translations || (data?.data as any) || {}
      // Load enabled languages
      const { data: langs } = await supabase.from("languages").select("code, enabled")
      enabledLangs = (langs || []).filter((l: any) => l.enabled).map((l: any) => l.code).filter((c: string) => c !== "en")
    }

    // Ensure key exists with EN
    current[key] = current[key] || {}
    if (!current[key].en?.value) current[key].en = { value: en, status: "reviewed" }

    // Auto-translate for missing targets
    const to = enabledLangs.filter((c) => !current[key][c]?.value)
    if (to.length) {
      for (const lang of to) {
        const out = await translateBatch([en], lang as any)
        current[key][lang] = { value: out[0] || en, status: "machine" }
      }
    }

    // Persist
    if (!hasSupabase) {
      memoryStore.ui_translations = current
    } else {
      const supabase = createClient()
      const upsert = { key: "ui_translations", data: { translations: current }, updated_at: new Date().toISOString() }
      const { error: upErr } = await supabase.from("site_settings").upsert(upsert, { onConflict: "key" })
      if (upErr) throw upErr
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Collect failed" }, { status: 500 })
  }
}