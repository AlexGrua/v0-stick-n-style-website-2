import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const supabase = createClient()
    const { key } = params

    if (key === "navigation") {
      // Get navigation data
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

      const navigationData = navData?.data || {}
      // Check if data exists and is explicitly false, otherwise default to true
      const switcherVisible = switcherData && switcherData.data === false ? false : true

      console.log("[v0] Language switcher visibility from DB:", switcherData?.data)
      console.log("[v0] Switcher data exists:", !!switcherData)
      console.log("[v0] Final showLanguageSwitcher value:", switcherVisible)

      return NextResponse.json({
        success: true,
        data: {
          ...navigationData,
          showLanguageSwitcher: switcherVisible,
        },
      })
    }

    const { data, error } = await supabase.from("site_settings").select("data").eq("key", key).single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data?.data || {},
    })
  } catch (error) {
    console.error(`Error loading ${params.key}:`, error)
    return NextResponse.json({ success: false, error: "Failed to load data" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const supabase = createClient()
    const { key } = params
    const requestData = await request.json()

    const { error } = await supabase.from("site_settings").upsert(
      {
        key,
        data: requestData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      },
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error saving ${params.key}:`, error)
    return NextResponse.json({ success: false, error: "Failed to save data" }, { status: 500 })
  }
}
