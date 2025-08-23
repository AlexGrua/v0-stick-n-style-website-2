import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { translateBatch } from "@/lib/translator"
import { requireRole } from "@/lib/api/guard"

// Storage shape: { [entityType]: { [entityId]: { [fieldPath]: { [lang]: { value, status } } } } }

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

export async function POST(request: Request) {
  try {
    const guard = requireRole(request, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const body = await request.json()
    const entityType = String(body?.entityType || "").trim()
    const entityId = String(body?.entityId || "").trim()
    const fields = (body?.fields || {}) as Record<string, string> // path -> english text
    const to = (body?.to || []) as string[]
    if (!entityType || !entityId) return fail("entityType and entityId are required", 400)

    // Load current store
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

    // For each target language, translate the set of field texts in a stable order
    const paths = Object.keys(fields)
    for (const lang of to) {
      const targetLang = String(lang) as any
      const sourceTexts = paths.map((p) => fields[p] || "")
      const translated = await translateBatch(sourceTexts, targetLang)

      paths.forEach((p, i) => {
        const value = translated[i] || ""
        const existing = base[p]?.[targetLang]?.value
        const existingStatus = base[p]?.[targetLang]?.status
        // Only write if missing or empty and do not overwrite reviewed values
        if (!existing || String(existing).trim().length === 0 || existingStatus !== "reviewed") {
          base[p] = {
            ...(base[p] || {}),
            [targetLang]: { value, status: "machine" },
          }
        }
      })
    }

    // Persist
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
    return fail(e?.message || "Auto-translate failed")
  }
}
