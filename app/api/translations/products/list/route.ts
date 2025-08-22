import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET products list for translations")

    // Получаем все продукты
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, description, specifications, in_stock")
      .order("name")

    if (productsError) {
      console.error("[v0] Error fetching products:", productsError)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    console.log("[v0] Products fetched for translations:", products?.length || 0)
    return NextResponse.json({ success: true, data: products || [] })
  } catch (error) {
    console.error("[v0] Products list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
