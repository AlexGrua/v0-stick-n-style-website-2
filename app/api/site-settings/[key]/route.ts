import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Simple in-memory store for local/dev preview
const MEM_KEY = "__SITE_SETTINGS_MEM__"
function mem(): Record<string, any> {
  // @ts-expect-error attach global for reuse across modules
  return (globalThis[MEM_KEY] = globalThis[MEM_KEY] || {})
}

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const { key } = params

    if (!hasSupabase) {
      const store = mem()
      if (key === "navigation") {
        const navigationData = store["navigation"] || {}
        const switcherVisible = store["language_switcher_visible"]?.visible !== false
        return NextResponse.json({
          success: true,
          data: { ...navigationData, showLanguageSwitcher: switcherVisible },
        })
      }
      return NextResponse.json({ success: true, data: store[key] || {} })
    }

    const supabase = createClient()

    if (key === "navigation") {
      const { data: navData, error: navError } = await supabase.from("site_settings").select("data").eq("key", "navigation").single()
      const { data: switcherData, error: switcherError } = await supabase
        .from("site_settings")
        .select("data")
        .eq("key", "language_switcher_visible")
        .single()

      if (navError && navError.code !== "PGRST116") throw navError
      if (switcherError && switcherError.code !== "PGRST116") throw switcherError

      const navigationData = navData?.data || {}
      const navToggle = (navigationData as any).showLanguageSwitcher
      const switcherVisible = typeof navToggle === "boolean" ? navToggle : switcherData?.data?.visible !== false

      return NextResponse.json({
        success: true,
        data: { ...navigationData, showLanguageSwitcher: switcherVisible },
      })
    }

    const { data, error } = await supabase.from("site_settings").select("data").eq("key", key).single()
    if (error && error.code !== "PGRST116") throw error

    return NextResponse.json({ success: true, data: data?.data || {} })
  } catch (error) {
    console.error(`Error loading ${params.key}:`, error)
    // Fallback to memory on error as well
    const store = mem()
    const key = params.key
    if (key === "navigation") {
      const navigationData = store["navigation"] || {}
      const switcherVisible = store["language_switcher_visible"]?.visible !== false
      return NextResponse.json({ success: true, data: { ...navigationData, showLanguageSwitcher: switcherVisible } })
    }
    return NextResponse.json({ success: true, data: store[key] || {} })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const { key } = params
    const requestData = await request.json()

    if (!hasSupabase) {
      const store = mem()
      store[key] = requestData
      // keep compatibility for navigation toggle
      if (key === "navigation" && typeof requestData?.showLanguageSwitcher === "boolean") {
        store["language_switcher_visible"] = { visible: !!requestData.showLanguageSwitcher }
      }
      return NextResponse.json({ success: true })
    }

    const supabase = createClient()

    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, data: requestData, updated_at: new Date().toISOString() }, { onConflict: "key" })

    if (error) throw error

    // Also persist separate toggle for compatibility
    if (key === "navigation" && typeof requestData?.showLanguageSwitcher === "boolean") {
      await supabase
        .from("site_settings")
        .upsert({ key: "language_switcher_visible", data: { visible: !!requestData.showLanguageSwitcher } }, { onConflict: "key" })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error saving ${params.key}:`, error)
    // Memory fallback on error
    const store = mem()
    const { key } = params
    try {
      const requestData = await request.json()
      store[key] = requestData
      if (key === "navigation" && typeof requestData?.showLanguageSwitcher === "boolean") {
        store["language_switcher_visible"] = { visible: !!requestData.showLanguageSwitcher }
      }
    } catch {}
    return NextResponse.json({ success: true })
  }
}
