import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/api/guard"

export async function GET(req: Request) {
  try {
    const supabase = createClient()
    
    // Получаем все подкатегории из отдельной таблицы subcategories
    const { data: subcategories, error } = await supabase
      .from("subcategories")
      .select(`
        id,
        name,
        slug,
        description,
        image_url,
        sort_order,
        is_active,
        created_at,
        updated_at,
        category_id,
        categories!inner(id, name, slug)
      `)
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error("Error fetching subcategories:", error)
      return NextResponse.json({ items: [], total: 0 })
    }
    
    // Форматируем данные для фронтенда
    const formattedSubcategories = subcategories?.map(sub => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      description: sub.description,
      image_url: sub.image_url,
      sort_order: sub.sort_order,
      is_active: sub.is_active,
      created_at: sub.created_at,
      updated_at: sub.updated_at,
      category_id: sub.category_id,
      category_name: sub.categories?.name
    })) || []
    
    return NextResponse.json({ 
      items: formattedSubcategories, 
      total: formattedSubcategories.length 
    })
  } catch (error) {
    console.error("Error in subcategories GET:", error)
    return NextResponse.json({ items: [], total: 0 })
  }
}

export async function POST(req: Request) {
  try {
    const guard = requireRole(req, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const supabase = createClient()
    const body = await req.json().catch(() => ({}))

    if (!body.category_id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
    }

    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Validate that category exists
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", body.category_id)
      .single()

    if (categoryError || !category) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 })
    }

    // Generate slug from name
    const slug = body.slug || body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    const { data: subcategory, error } = await supabase
      .from("subcategories")
      .insert({
        category_id: Number(body.category_id),
        name: body.name,
        slug: slug,
        description: body.description || "",
        image_url: body.image_url || "",
        sort_order: body.sort_order || 0,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating subcategory:", error)
      return NextResponse.json({ error: "Failed to create subcategory" }, { status: 500 })
    }

    return NextResponse.json(subcategory, { status: 201 })
  } catch (error) {
    console.error("Error in subcategories POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
