import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { translateBatch } from "@/lib/translator"
import type { LangCode } from "@/lib/i18n"

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
const memoryStore: { ui_translations?: Record<string, Record<string, { value: string; status?: "machine" | "reviewed" }>> } =
  // @ts-expect-error attach global for dev fallback
  (globalThis.__UI_TRANSLATIONS__ = globalThis.__UI_TRANSLATIONS__ || {})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const to: LangCode[] = Array.isArray(body?.to) ? body.to : []
    if (!to.length) return NextResponse.json({ success: false, error: "Missing 'to' languages" }, { status: 400 })

    // Load current translations
    let current: Record<string, Record<string, { value: string; status?: string }>> = {}
    if (!hasSupabase) {
      current = memoryStore.ui_translations || {}
    } else {
      const supabase = createClient()
      const { data, error } = await supabase.from("site_settings").select("data").eq("key", "ui_translations").single()
      if (error && error.code !== "PGRST116") throw error
      current = (data?.data as any)?.translations || (data?.data as any) || {}
    }

    const keys = Object.keys(current)
    const enTexts = keys.map((k) => current[k]?.en?.value || "")

    // For each target language, translate only missing or empty values
    for (const lang of to) {
      const missingIdx: number[] = []
      const batch: string[] = []
      keys.forEach((k, i) => {
        const existing = current[k]?.[lang]?.value
        if (!existing) {
          const src = current[k]?.en?.value || ""
          missingIdx.push(i)
          batch.push(src)
        }
      })
      if (batch.length === 0) continue

      const out = await translateBatch(batch, lang)
      out.forEach((val, j) => {
        const idx = missingIdx[j]
        const key = keys[idx]
        current[key] = current[key] || {}
        current[key][lang] = { value: val, status: "machine" }
      })
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
    return NextResponse.json({ success: false, error: e?.message || "Auto-translate failed" }, { status: 500 })
  }
}