import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireRole } from "@/lib/api/guard"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
  realtime: { enabled: false },
})

export async function GET() {
  try {
    const { data, error } = await supabase.from("site_settings").select("*").eq("key", "footer").single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching footer data:", error)
      return NextResponse.json({ error: "Failed to fetch footer data" }, { status: 500 })
    }

    // Return the footer data or empty object if not found
    return NextResponse.json(data?.value || {})
  } catch (error) {
    console.error("Error in footer GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = requireRole(request, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const footerData = await request.json()

    // Upsert the footer data
    const { error } = await supabase.from("site_settings").upsert({
      key: "footer",
      value: footerData,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error saving footer data:", error)
      return NextResponse.json({ error: "Failed to save footer data" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in footer PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
