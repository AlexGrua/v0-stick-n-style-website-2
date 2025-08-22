import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("id")
    const languageCode = searchParams.get("lang")

    console.log("[v0] GET translation request:", { productId, languageCode })

    if (!productId || !languageCode) {
      return NextResponse.json({ error: "Missing product ID or language code" }, { status: 400 })
    }

    // Получаем перевод из базы данных
    const { data: translation, error } = await supabaseAdmin
      .from("product_translations")
      .select("*")
      .eq("product_id", productId)
      .eq("language_code", languageCode)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching translation:", error)
      return NextResponse.json({ error: "Failed to fetch translation" }, { status: 500 })
    }

    console.log("[v0] Translation fetched:", translation ? "found" : "not found")
    return NextResponse.json(translation || {})
  } catch (error) {
    console.error("[v0] Translation GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, language_code, name, description, specifications } = body

    console.log("[v0] POST translation request:", { product_id, language_code, name: name?.substring(0, 50) })

    if (!product_id || !language_code || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Проверяем, существует ли уже перевод
    const { data: existing } = await supabaseAdmin
      .from("product_translations")
      .select("id")
      .eq("product_id", product_id)
      .eq("language_code", language_code)
      .single()

    let result
    if (existing) {
      // Обновляем существующий перевод
      const { data, error } = await supabaseAdmin
        .from("product_translations")
        .update({
          name,
          description,
          specifications,
          updated_at: new Date().toISOString(),
        })
        .eq("product_id", product_id)
        .eq("language_code", language_code)
        .select()
        .single()

      if (error) throw error
      result = data
      console.log("[v0] Translation updated successfully")
    } else {
      // Создаем новый перевод
      const { data, error } = await supabaseAdmin
        .from("product_translations")
        .insert({
          product_id,
          language_code,
          name,
          description,
          specifications,
        })
        .select()
        .single()

      if (error) throw error
      result = data
      console.log("[v0] Translation created successfully")
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Translation POST error:", error)
    return NextResponse.json({ error: "Failed to save translation" }, { status: 500 })
  }
}
