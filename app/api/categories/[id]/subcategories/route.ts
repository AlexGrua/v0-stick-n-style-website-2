import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/api/guard"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    // Получаем subcategories для конкретной категории
    const { data: subcategories, error } = await supabase
      .from("subcategories")
      .select("*")
      .eq("category_id", id)
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching subcategories:", error)
      return NextResponse.json({ items: [], total: 0 })
    }

    return NextResponse.json({ 
      items: subcategories || [], 
      total: subcategories?.length || 0 
    })
  } catch (error) {
    console.error("Error in subcategories GET:", error)
    return NextResponse.json({ items: [], total: 0 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = requireRole(req, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const { id } = await params
    const supabase = createClient()
    const body = await req.json().catch(() => ({}))

    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Проверяем, что категория существует
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", id)
      .single()

    if (categoryError || !category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Создаем subcategory
    const { data: subcategory, error } = await supabase
      .from("subcategories")
      .insert({
        category_id: parseInt(id),
        name: body.name,
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
