import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
const memoryStore: { visible?: boolean } = (globalThis as any).__LANG_SWITCH__ || {}
if (!(globalThis as any).__LANG_SWITCH__) (globalThis as any).__LANG_SWITCH__ = memoryStore

export async function GET() {
  try {
    if (!hasSupabase) {
      const visible = memoryStore.visible !== false
      return NextResponse.json({ success: true, data: { visible } })
    }

    const supabase = createClient()
    const { data, error } = await supabase.from("site_settings").select("data").eq("key", "language_switcher_visible").single()
    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    const visible = data?.data?.visible !== false
    return NextResponse.json({ success: true, data: { visible } })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { visible } = await request.json()
    if (!hasSupabase) {
      memoryStore.visible = !!visible
      return NextResponse.json({ success: true })
    }

    const supabase = createClient()
    const { data: existing } = await supabase.from("site_settings").select("id").eq("key", "language_switcher_visible").single()

    if (existing) {
      const { error } = await supabase
        .from("site_settings")
        .update({ data: { visible }, updated_at: new Date().toISOString() })
        .eq("key", "language_switcher_visible")
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    } else {
      const { error } = await supabase.from("site_settings").insert({ key: "language_switcher_visible", data: { visible }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
