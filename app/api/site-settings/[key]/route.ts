import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const memStore: Record<string, any> = {}

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const supabase = createClient()
    const { key } = params

    if ((supabase as any).from("x").select === undefined) {
      // Dummy client: use memory
      if (key === "navigation") {
        const data = memStore["navigation"] || { items: [], showLanguageSwitcher: true }
        return NextResponse.json({ success: true, data })
      }
      return NextResponse.json({ success: true, data: memStore[key] || {} })
    }

    if (key === "navigation") {
      const { data: navData, error: navError } = await supabase
        .from("site_settings")
        .select("data")
        .eq("key", "navigation")
        .single()

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

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json({ success: true, data: data?.data || {} })
  } catch (error) {
    console.error(`Error loading ${params.key}:`, error)
    return NextResponse.json({ success: true, data: memStore[params.key] || {} })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const supabase = createClient()
    const { key } = params
    const requestData = await request.json()

    if ((supabase as any).from("x").select === undefined) {
      memStore[key] = requestData
      return NextResponse.json({ success: true })
    }

    const { error } = await supabase.from("site_settings").upsert(
      { key, data: requestData, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error saving ${params.key}:`, error)
    memStore[params.key] = memStore[params.key] || {}
    return NextResponse.json({ success: false, error: "Failed to save data" }, { status: 500 })
  }
}
