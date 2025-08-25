import { NextResponse } from "next/server"
import { getCategoryById, updateCategory, deleteCategory } from "@/lib/db"
import { requireRole } from "@/lib/api/guard"
import { createClient } from "@/lib/supabase/server"

function toSlug(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback UUID generation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[v0] Getting category with ID:", id)
    const category = await getCategoryById(id)
    if (!category) {
      console.log("[v0] Category not found:", id)
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    console.log("[v0] Category found:", category)
    return NextResponse.json(category)
  } catch (error) {
    console.error("[v0] Error fetching category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = requireRole(req, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const { id } = await params
    console.log("[v0] Starting PUT request for category ID:", id)

    const patch = await req.json().catch((err) => {
      console.error("[v0] Error parsing JSON:", err)
      return {}
    })
    console.log("[v0] Received patch data:", patch)

    if (patch?.name && !patch?.slug) {
      patch.slug = toSlug(String(patch.name))
      console.log("[v0] Generated slug:", patch.slug)
    }

    // Убираем обработку subcategories - они управляются через отдельный API
    if (patch?.subcategories) {
      console.log("[v0] Ignoring subcategories in category update - use /api/subcategories instead")
      delete patch.subcategories
    }

    console.log("[v0] Calling updateCategory with:", id, patch)
    const updatedCategory = await updateCategory(id, patch)
    console.log("[v0] Category updated successfully:", updatedCategory)

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error("[v0] Error updating category:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createClient()

    console.log(`[v0] Attempting to delete category ${id}`)

    // Проверяем, есть ли связанные продукты (это блокируем)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('category_id', id)
      .limit(1)

    if (productsError) {
      console.error('Error checking products:', productsError)
      return Response.json({ 
        error: 'Database error', 
        details: 'Failed to check related products',
        code: 'DB_ERROR'
      }, { status: 500 })
    }

    if (products && products.length > 0) {
      console.log(`[v0] Cannot delete category - has related products: ${products.length}`)
      return Response.json({ 
        error: 'Cannot delete category', 
        details: `This category has ${products.length} related product(s)`,
        code: 'HAS_RELATED_PRODUCTS'
      }, { status: 400 })
    }

    // Удаляем категорию (подкатегории удалятся автоматически благодаря CASCADE)
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting category:', deleteError)
      
      // Обрабатываем FK violation
      if (deleteError.code === '23503') {
        return Response.json({ 
          error: 'Cannot delete category', 
          details: 'This category is referenced by other records',
          code: 'FOREIGN_KEY_VIOLATION'
        }, { status: 400 })
      }
      
      return Response.json({ 
        error: 'Database error', 
        details: deleteError.message,
        code: 'DELETE_ERROR'
      }, { status: 500 })
    }

    console.log(`[v0] Category ${id} deleted successfully`)
    return Response.json({ success: true, message: 'Category deleted successfully' })

  } catch (error) {
    console.error('Unexpected error in DELETE category:', error)
    return Response.json({ 
      error: 'Internal server error', 
      details: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = requireRole(request, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const { id } = await params
    const patch = await request.json()

    // Разрешаем только обновление статуса
    const updateData: any = {}
    
    if (patch.status !== undefined) {
      if (patch.status !== 'active' && patch.status !== 'inactive') {
        return NextResponse.json({ 
          error: "Invalid status",
          details: "Status must be 'active' or 'inactive'"
        }, { status: 400 })
      }
      updateData.status = patch.status
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        details: "Only status field can be updated via PATCH"
      }, { status: 400 })
    }

    updateData.updated_at = new Date().toISOString()

    const supabase = createClient()
    const { data: category, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating category status:", error)
      return NextResponse.json({ 
        error: "Failed to update category status",
        details: error.message || "Database error occurred"
      }, { status: 500 })
    }

    // Маппинг ответа для frontend
    const mappedCategory = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      status: category.status,
      subcategories: [], // Подкатегории получаются через отдельный API
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    }

    return NextResponse.json(mappedCategory, { status: 200 })
  } catch (error) {
    console.error("Error updating category status:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: "An unexpected error occurred while updating the category status"
    }, { status: 500 })
  }
}
