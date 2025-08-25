import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ВАЖНО: чтобы точно выполнялось на Node и логировалось в терминале
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
  console.log('[api] GET /api/categories - начало')
  
  try {
    const supabase = createClient()
    
    // Получаем категории
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, status, created_at, updated_at')
      .order('id')

    if (categoriesError) {
      console.error('[api] Error fetching categories:', categoriesError)
      return Response.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Получаем все подкатегории
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('subcategories')
      .select('id, name, category_id')
      .order('category_id, id')

    if (subcategoriesError) {
      console.error('[api] Error fetching subcategories:', subcategoriesError)
      return Response.json({ error: 'Failed to fetch subcategories' }, { status: 500 })
    }

    // Группируем подкатегории по category_id
    const subcategoriesByCategory = subcategories?.reduce((acc: Record<number, Array<{id: number, name: string}>>, sub: any) => {
      if (!acc[sub.category_id]) {
        acc[sub.category_id] = []
      }
      acc[sub.category_id].push({
        id: sub.id,
        name: sub.name
      })
      return acc
    }, {} as Record<number, Array<{id: number, name: string}>>) || {}

    // Формируем финальный ответ с правильными подкатегориями
    const items = categories?.map((category: any) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      status: category.status,
      subcategories: subcategoriesByCategory[category.id] || [], // Используем данные из subcategories
      createdAt: category.created_at,
      updatedAt: category.updated_at
    })) || []

    console.log('[api] GET /api/categories - успешно, категорий:', items.length)
    return Response.json({ items })
  } catch (error) {
    console.error('[api] Unexpected error in categories GET:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  console.log('[api] POST /api/categories - начало')
  console.time('[api] POST /api/categories')
  
  try {
    const body = await req.json().catch(() => ({}))
    console.log('[api] incoming payload:', JSON.stringify(body, null, 2))

    // Валидация входных данных
    const name: string = (body.name || "").trim()
    if (!name) {
      console.log('[api] Validation error: name is required')
      return NextResponse.json({ 
        error: "Name is required", 
        code: 'VALIDATION_ERROR',
        details: 'Category name cannot be empty'
      }, { status: 400 })
    }

    // Валидация подкатегорий (если переданы)
    const subcategories = body.subcategories || []
    if (!Array.isArray(subcategories)) {
      console.log('[api] Validation error: subcategories must be an array')
      return NextResponse.json({ 
        error: "Invalid subcategories format", 
        code: 'VALIDATION_ERROR',
        details: 'Subcategories must be an array'
      }, { status: 400 })
    }

    // Проверяем каждую подкатегорию
    for (let i = 0; i < subcategories.length; i++) {
      const sub = subcategories[i]
      if (!sub || typeof sub.name !== 'string' || !sub.name.trim()) {
        console.log('[api] Validation error: invalid subcategory at index', i)
        return NextResponse.json({ 
          error: "Invalid subcategory", 
          code: 'VALIDATION_ERROR',
          details: `Subcategory at index ${i} must have a valid name`
        }, { status: 400 })
      }
    }

    console.log('[api] Validation passed. Name:', name, 'Subcategories count:', subcategories.length)

    const supabase = createClient()
    
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
    const status: string = body.status || "active"

    console.log('[api] Creating category with data:', { name, slug, description, image_url, status })

    // Создаем категорию
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .insert({
        name,
        slug,
        description,
        image_url,
        status,
      })
      .select()
      .single()

    if (categoryError) {
      console.error("[api] Error creating category:", categoryError)
      return NextResponse.json({ 
        error: "Failed to create category", 
        details: categoryError.message,
        code: categoryError.code 
      }, { status: 500 })
    }

    console.log('[api] Category created successfully:', category.id)

    // Создаем подкатегории, если они есть
    if (subcategories.length > 0) {
      console.log('[api] Creating subcategories:', subcategories.length)
      
      const subcategoriesData = subcategories.map((sub: any) => ({
        name: sub.name.trim(),
        slug: toSlug(sub.name.trim()),
        description: '',
        image_url: null,
        sort_order: 0,
        is_active: true,
        category_id: category.id
      }))

      console.log('[api] Subcategories data to insert:', subcategoriesData)

      const { data: createdSubcategories, error: subsError } = await supabase
        .from("subcategories")
        .insert(subcategoriesData)
        .select()

      if (subsError) {
        console.error("[api] Error creating subcategories:", subsError)
        console.error("[api] Error details:", JSON.stringify(subsError, null, 2))
        
        // Проверяем, не RLS ли это
        if (subsError.code === '42501') {
          console.error("[api] RLS POLICY ERROR - Row Level Security is blocking the operation")
          console.error("[api] You need to create RLS policies for subcategories table")
        }
        
        // Не откатываем категорию, просто логируем ошибку
        console.error("⚠️ Category created, but subcategories failed")
        
        // Возвращаем категорию без подкатегорий
        const result = {
          ...category,
          subcategories: []
        }
        
        console.timeEnd('[api] POST /api/categories')
        return NextResponse.json(result, { status: 201 })
      } else {
        console.log('[api] Subcategories created successfully:', subcategories)
      }
    } else {
      console.log('[api] No subcategories to create')
    }

    // Возвращаем категорию с подкатегориями
    const result = {
      ...category,
      subcategories: subcategories.map((sub: any, index: number) => ({
        id: sub.id || `temp-${index}`,
        name: sub.name
      }))
    }

    console.log('[api] Returning result:', result)
    console.timeEnd('[api] POST /api/categories')
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("[api] Critical error in categories POST:", error)
    console.timeEnd('[api] POST /api/categories')
    return NextResponse.json({ 
      error: "Failed to create category", 
      details: error instanceof Error ? error.message : String(error),
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}
