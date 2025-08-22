import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET categories list for translations")

    // Получаем все категории
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from("categories")
      .select("id, name, description, is_active")
      .order("name")

    if (categoriesError) {
      console.error("[v0] Error fetching categories:", categoriesError)
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }

    console.log("[v0] Categories fetched for translations:", categories?.length || 0)
    return NextResponse.json({ success: true, data: categories || [] })
  } catch (error) {
    console.error("[v0] Categories list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
