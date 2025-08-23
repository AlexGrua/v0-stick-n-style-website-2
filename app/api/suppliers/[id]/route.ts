import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireRole } from "@/lib/api/guard"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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
      categories: supplier.categories,
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
      categories: supplier.categories,
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

    const { error } = await supabase.from("suppliers").delete().eq("id", ctx.params.id)

    if (error) {
      console.error("Error deleting supplier:", error)
      return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error deleting supplier:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
