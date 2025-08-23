import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const MEM_KEY = "__LANG_MEM__"
function mem(): any[] {
  // @ts-expect-error attach global for reuse
  return (globalThis[MEM_KEY] = globalThis[MEM_KEY] || [
    { code: "zh", name: "Chinese", flag_icon: "🇨🇳", is_active: true },
    { code: "en", name: "English", flag_icon: "🇪🇳", is_active: true },
    { code: "ru", name: "Russian", flag_icon: "🇷🇺", is_active: true },
    { code: "es", name: "Spanish", flag_icon: "🇪🇸", is_active: true },
  ])
}

export async function GET() {
  try {
    console.log("[v0] GET languages request started")

    if (!hasSupabase) {
      const list = mem()
      return NextResponse.json({ success: true, data: list })
    }

    const supabase = createClient()
    const { data: languages, error } = await supabase.from("languages").select("*").order("name")

    if (error) throw error

    return NextResponse.json({ success: true, data: languages })
  } catch (error) {
    console.error("[v0] Languages API error:", error)
    // fallback memory
    const list = mem()
    return NextResponse.json({ success: true, data: list })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!hasSupabase) {
      const list = mem()
      list.push(body)
      return NextResponse.json({ success: true, data: body })
    }

    const supabase = createClient()
    const { data, error } = await supabase.from("languages").insert([body]).select().single()
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Create language error:", error)
    // memory append
    try {
      const body = await request.json()
      const list = mem()
      list.push(body)
      return NextResponse.json({ success: true, data: body })
    } catch {
      return NextResponse.json({ success: false, error: "Failed to create language" }, { status: 500 })
    }
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { languages, showLanguageSwitcher } = body

    if (!hasSupabase) {
      // update memory
      const list = mem()
      languages.forEach((l: any) => {
        const idx = list.findIndex((x) => x.id === l.id || x.code === l.code)
        if (idx !== -1) list[idx] = { ...list[idx], is_active: l.isActive, is_default: l.isDefault }
      })
      const storeKey = "__SITE_SETTINGS_MEM__"
      // @ts-expect-error global store
      const store = (globalThis[storeKey] = globalThis[storeKey] || {})
      store["language_switcher_visible"] = { visible: !!showLanguageSwitcher }
      return NextResponse.json({ success: true })
    }

    const supabase = createClient()

    // Update languages
    for (const language of languages) {
      const { error } = await supabase
        .from("languages")
        .update({ is_active: language.isActive, is_default: language.isDefault })
        .eq("id", language.id)
      if (error) throw error
    }

    // language switcher setting
    const { data: existingSetting } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", "language_switcher_visible")
      .single()

    if (existingSetting) {
      const { error: settingsError } = await supabase
        .from("site_settings")
        .update({ data: { visible: showLanguageSwitcher } })
        .eq("key", "language_switcher_visible")
      if (settingsError) throw settingsError
    } else {
      const { error: settingsError } = await supabase
        .from("site_settings")
        .insert({ key: "language_switcher_visible", data: { visible: showLanguageSwitcher } })
      if (settingsError) throw settingsError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update languages error:", error)
    // memory fallback
    try {
      const body = await request.json()
      const { languages, showLanguageSwitcher } = body
      const list = mem()
      languages.forEach((l: any) => {
        const idx = list.findIndex((x) => x.id === l.id || x.code === l.code)
        if (idx !== -1) list[idx] = { ...list[idx], is_active: l.isActive, is_default: l.isDefault }
      })
      const storeKey = "__SITE_SETTINGS_MEM__"
      // @ts-expect-error global store
      const store = (globalThis[storeKey] = globalThis[storeKey] || {})
      store["language_switcher_visible"] = { visible: !!showLanguageSwitcher }
      return NextResponse.json({ success: true })
    } catch {
      return NextResponse.json({ success: false, error: "Failed to update languages" }, { status: 500 })
    }
  }
}
