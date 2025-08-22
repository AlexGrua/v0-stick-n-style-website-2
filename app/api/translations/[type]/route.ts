import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const languageCode = searchParams.get("lang") || "en"
    const itemId = searchParams.get("id")

    console.log(`[v0] Fetching ${params.type} translations for language: ${languageCode}`)

    let query
    let data

    switch (params.type) {
      case "products":
        if (itemId) {
          query = supabase
            .from("product_translations")
            .select("*")
            .eq("product_id", itemId)
            .eq("language_code", languageCode)
            .single()
        } else {
          query = supabase
            .from("product_translations")
            .select(`
              *,
              products!inner(id, sku, price, is_active)
            `)
            .eq("language_code", languageCode)
        }
        break

      case "categories":
        if (itemId) {
          query = supabase
            .from("category_translations")
            .select("*")
            .eq("category_id", itemId)
            .eq("language_code", languageCode)
            .single()
        } else {
          query = supabase
            .from("category_translations")
            .select(`
              *,
              categories!inner(id, slug, is_active)
            `)
            .eq("language_code", languageCode)
        }
        break

      case "pages":
        const pageKey = searchParams.get("page_key") || "home_page"
        query = supabase
          .from("page_translations")
          .select("*")
          .eq("page_key", pageKey)
          .eq("language_code", languageCode)
          .single()
        break

      default:
        return NextResponse.json({ error: "Invalid translation type" }, { status: 400 })
    }

    const { data: result, error } = await query

    if (error) {
      console.log(`[v0] Translation fetch error:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[v0] Translations fetched successfully:`, result ? "found" : "not found")
    return NextResponse.json(result || {})
  } catch (error) {
    console.error(`[v0] Translation API error:`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    console.log(`[v0] Creating ${params.type} translation:`, body)

    let query
    let tableName

    switch (params.type) {
      case "products":
        tableName = "product_translations"
        query = supabase.from(tableName).upsert({
          product_id: body.product_id,
          language_code: body.language_code,
          name: body.name,
          description: body.description,
          specifications: body.specifications,
        })
        break

      case "categories":
        tableName = "category_translations"
        query = supabase.from(tableName).upsert({
          category_id: body.category_id,
          language_code: body.language_code,
          name: body.name,
          description: body.description,
        })
        break

      case "pages":
        tableName = "page_translations"
        query = supabase.from(tableName).upsert({
          page_key: body.page_key,
          language_code: body.language_code,
          content: body.content,
        })
        break

      default:
        return NextResponse.json({ error: "Invalid translation type" }, { status: 400 })
    }

    const { data, error } = await query.select()

    if (error) {
      console.log(`[v0] Translation save error:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[v0] Translation saved successfully`)
    return NextResponse.json(data)
  } catch (error) {
    console.error(`[v0] Translation save error:`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
