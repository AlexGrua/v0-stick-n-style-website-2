import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Getting language switcher visibility...")

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const { data, error } = await supabase
      .from("site_settings")
      .select("data")
      .eq("key", "language_switcher_visible")
      .single()

    if (error && error.code !== "PGRST116") {
      console.log("[v0] Error fetching visibility:", error)
      return NextResponse.json({ visible: true }) // Default to visible
    }

    const isVisible = data?.data !== false
    console.log("[v0] Language switcher visibility from DB:", isVisible)

    return NextResponse.json({ visible: isVisible })
  } catch (error) {
    console.log("[v0] Error in visibility API:", error)
    return NextResponse.json({ visible: true }) // Default to visible
  }
}

export async function POST(request: NextRequest) {
  try {
    const { visible } = await request.json()
    console.log("[v0] Setting language switcher visibility to:", visible)

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "language_switcher_visible",
        data: visible,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      },
    )

    if (error) {
      console.log("[v0] Error saving visibility:", error)
      return NextResponse.json({ success: false, error: error.message })
    }

    console.log("[v0] Language switcher visibility saved successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.log("[v0] Error in visibility save API:", error)
    return NextResponse.json({ success: false, error: "Failed to save visibility" })
  }
}
