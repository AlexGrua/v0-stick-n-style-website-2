import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    console.log("[v0] GET language_switcher_visible request")

    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("data")
      .eq("key", "language_switcher_visible")
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching language switcher visibility:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const visible = data?.data?.visible !== false // Default to true if not set
    console.log("[v0] Language switcher visibility:", visible)

    return NextResponse.json({
      success: true,
      data: { visible },
    })
  } catch (error) {
    console.error("[v0] Error in GET language_switcher_visible:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] PUT language_switcher_visible request")
    const { visible } = await request.json()
    console.log("[v0] Setting language switcher visibility to:", visible)

    // Check if record exists
    const { data: existing } = await supabaseAdmin
      .from("site_settings")
      .select("id")
      .eq("key", "language_switcher_visible")
      .single()

    if (existing) {
      // Update existing record
      const { error } = await supabaseAdmin
        .from("site_settings")
        .update({
          data: { visible },
          updated_at: new Date().toISOString(),
        })
        .eq("key", "language_switcher_visible")

      if (error) {
        console.error("[v0] Error updating language switcher visibility:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
    } else {
      // Create new record
      const { error } = await supabaseAdmin.from("site_settings").insert({
        key: "language_switcher_visible",
        data: { visible },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("[v0] Error creating language switcher visibility:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
    }

    console.log("[v0] Language switcher visibility saved successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in PUT language_switcher_visible:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
