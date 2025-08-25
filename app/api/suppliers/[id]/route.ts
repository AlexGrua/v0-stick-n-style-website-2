import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/api/guard"
import { normalizeCategoryField } from "@/lib/normalize"

function normalizeCategories(raw: any): string[] {
  if (Array.isArray(raw)) return raw.filter(Boolean)
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
      return [raw]
    } catch {
      return [raw]
    }
  }
  return []
}

const supabase = createClient()

type RouteContext = { params: { id: string } }

export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const { data: supplier, error } = await supabase.from("suppliers").select("*").eq("id", ctx.params.id).single()

    if (error || !supplier) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Маппинг данных для frontend
    const mappedSupplier = {
      id: supplier.id,
      shortName: supplier.name,
      companyName: supplier.name,
      contactPerson: supplier.contact_person,
      contactEmail: supplier.email,
      contactPhone: supplier.phone,
      address: supplier.address,
      categories: normalizeCategoryField(supplier.categories),
      status: supplier.status,
      notes: supplier.notes,
    }

    return NextResponse.json(mappedSupplier, { status: 200 })
  } catch (error) {
    console.error("Error fetching supplier:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, ctx: RouteContext) {
  try {
    const guard = requireRole(request, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const patch = await request.json()

    // Маппинг данных из frontend в БД формат
    const updateData: any = {}

    if (patch.shortName || patch.companyName) {
      updateData.name = patch.shortName || patch.companyName
    }
    if (patch.contactEmail !== undefined) updateData.email = patch.contactEmail
    if (patch.contactPhone !== undefined) updateData.phone = patch.contactPhone
    if (patch.address !== undefined) updateData.address = patch.address
    if (patch.contactPerson !== undefined) updateData.contact_person = patch.contactPerson
    if (patch.categories !== undefined) updateData.categories = patch.categories
    if (patch.status !== undefined) updateData.status = patch.status
    if (patch.notes !== undefined) updateData.notes = patch.notes

    updateData.updated_at = new Date().toISOString()

    const { data: supplier, error } = await supabase
      .from("suppliers")
      .update(updateData)
      .eq("id", ctx.params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating supplier:", error)
      return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 })
    }

    // Маппинг ответа для frontend
    const mappedSupplier = {
      id: supplier.id,
      shortName: supplier.name,
      companyName: supplier.name,
      contactPerson: supplier.contact_person,
      contactEmail: supplier.email,
      contactPhone: supplier.phone,
      address: supplier.address,
      categories: normalizeCategoryField(supplier.categories),
      status: supplier.status,
      notes: supplier.notes,
    }

    return NextResponse.json(mappedSupplier, { status: 200 })
  } catch (error) {
    console.error("Error updating supplier:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, ctx: RouteContext) {
  try {
    const guard = requireRole(req, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const { id } = await ctx.params

    const { error } = await supabase.from("suppliers").delete().eq("id", id)

    if (error) {
      console.error("Error deleting supplier:", error)
      
      // Обработка специфических ошибок
      if (error.code === '23503') {
        return NextResponse.json({ 
          error: "Cannot delete supplier",
          details: "This supplier is referenced by other records. Please remove all references first."
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: "Failed to delete supplier",
        details: error.message || "Database error occurred"
      }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error deleting supplier:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: "An unexpected error occurred while deleting the supplier"
    }, { status: 500 })
  }
}

export async function PATCH(request: Request, ctx: RouteContext) {
  try {
    const guard = requireRole(request, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const { id } = await ctx.params
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

    const { data: supplier, error } = await supabase
      .from("suppliers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating supplier status:", error)
      return NextResponse.json({ 
        error: "Failed to update supplier status",
        details: error.message || "Database error occurred"
      }, { status: 500 })
    }

    // Маппинг ответа для frontend
    const mappedSupplier = {
      id: supplier.id,
      shortName: supplier.name,
      companyName: supplier.name,
      contactPerson: supplier.contact_person,
      contactEmail: supplier.email,
      contactPhone: supplier.phone,
      address: supplier.address,
      categories: normalizeCategoryField(supplier.categories),
      status: supplier.status,
      notes: supplier.notes,
    }

    return NextResponse.json(mappedSupplier, { status: 200 })
  } catch (error) {
    console.error("Error updating supplier status:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: "An unexpected error occurred while updating the supplier status"
    }, { status: 500 })
  }
}
