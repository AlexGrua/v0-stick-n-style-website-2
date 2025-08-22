import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    console.log("[v0] GET bulk translations request")

    // Get all translations with product info
    const { data: translations, error } = await supabase.from("product_translations").select(`
        product_id,
        language_code,
        name,
        description,
        specifications,
        products!inner(name, description, specifications)
      `)

    if (error) {
      console.error("[v0] Error fetching bulk translations:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("[v0] Bulk translations fetched:", translations?.length || 0)

    return NextResponse.json({
      success: true,
      data: translations || [],
    })
  } catch (error) {
    console.error("[v0] Error in bulk translations GET:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] POST bulk translations request")

    const { translations } = await request.json()

    if (!Array.isArray(translations)) {
      return NextResponse.json({ success: false, error: "Invalid translations data" }, { status: 400 })
    }

    // Upsert all translations
    const { error } = await supabase.from("product_translations").upsert(
      translations.map((t) => ({
        product_id: t.product_id,
        language_code: t.language_code,
        name: t.name,
        description: t.description,
        specifications: t.specifications,
      })),
      {
        onConflict: "product_id,language_code",
        ignoreDuplicates: false,
      },
    )

    if (error) {
      console.error("[v0] Error saving bulk translations:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("[v0] Bulk translations saved:", translations.length)

    return NextResponse.json({
      success: true,
      message: `${translations.length} translations saved successfully`,
    })
  } catch (error) {
    console.error("[v0] Error in bulk translations POST:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
