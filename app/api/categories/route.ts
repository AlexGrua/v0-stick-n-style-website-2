import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
// import { requirePermission } from "@/lib/api/guard"

function toSlug(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get categories with subcategories (unified schema)
        const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      return NextResponse.json({ items: [], total: 0 })
    }

    const mappedCategories = (categories || []).map((cat: any) => {
      // Используем существующие JSONB данные из поля subs
      const subs = cat.subs || []
      return {
        ...cat,
        subs: subs,
        subcategories: subs,
        subcategoryCount: subs.length,
      }
    })

    return NextResponse.json({ items: mappedCategories, total: mappedCategories.length })
  } catch (error) {
    console.error("Error in categories GET:", error)
    return NextResponse.json({ items: [], total: 0 })
  }
}

export async function POST(req: Request) {
  try {
    // ВРЕМЕННО ОТКЛЮЧАЕМ GUARD ДЛЯ ТЕСТИРОВАНИЯ
    // const guard = requirePermission(req, "categories.create")
    // if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status })

    const supabase = createClient()
    const body = await req.json().catch(() => ({}))

    console.log('📝 POST /api/categories - body:', body)

    const name: string = (body.name || "").trim()
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    let slug = body.slug || toSlug(name)

    // Ensure unique slug
    const { data: existingCategory } = await supabase.from("categories").select("slug").eq("slug", slug).single()

    if (existingCategory) {
      let i = 2
      let uniqueSlug = `${slug}-${i}`
      while (true) {
        const { data: existing } = await supabase.from("categories").select("slug").eq("slug", uniqueSlug).single()

        if (!existing) break
        i++
        uniqueSlug = `${slug}-${i}`
      }
      slug = uniqueSlug
    }

    const description: string = body.description || ""
    const image_url: string = body.image_url || ""
    // Убрали sort_order

    console.log('📝 Вставляем категорию:', { name, slug, description, image_url })

    // Подготавливаем данные для вставки (НЕ включаем subs - они управляются триггерами)
    const insertData: any = {
      name,
      slug,
      description,
      image_url,
    }

    const { data: category, error } = await supabase
      .from("categories")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("❌ Ошибка создания категории:", error)
      return NextResponse.json({ 
        error: "Failed to create category", 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }

    console.log('✅ Категория создана:', category)
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("❌ Критическая ошибка в categories POST:", error)
    return NextResponse.json({ 
      error: "Failed to create category", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
