import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/api/guard"

const supabase = createClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""

    let query = supabase.from("suppliers").select("*").order("name", { ascending: true })

    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,contact_person.ilike.%${search}%`)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: suppliers, error } = await query

    if (error) {
      console.error("Error fetching suppliers:", error)
      return NextResponse.json({ items: [], total: 0 }, { status: 500 })
    }

    const mappedSuppliers = (suppliers || []).map((supplier: any) => ({
      id: supplier.id,
      code: `S${supplier.id.toString().padStart(3, '0')}`, // Генерируем код, так как колонки code нет
      shortName: supplier.name, // Using name as shortName for frontend compatibility
      companyName: supplier.name,
      contactPerson: supplier.contact_person,
      contactEmail: supplier.email,
      contactPhone: supplier.phone,
      address: supplier.address,
      categories: supplier.categories,
      status: supplier.status,
      notes: supplier.notes,
    }))

    return NextResponse.json({
      items: mappedSuppliers,
      total: mappedSuppliers.length,
    })
  } catch (error) {
    console.error("Error in suppliers GET:", error)
    return NextResponse.json({ items: [], total: 0 }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const guard = requirePermission(request, "suppliers.create")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const payload = await request.json()

    // Валидация обязательных полей
    if (!payload.shortName && !payload.companyName) {
      return NextResponse.json({ 
        error: "Company name or short name is required",
        details: "Please provide either company name or short name"
      }, { status: 400 })
    }

    if (!payload.contactPerson) {
      return NextResponse.json({ 
        error: "Contact person is required",
        details: "Please provide contact person name"
      }, { status: 400 })
    }

    if (!payload.categories || payload.categories.length === 0) {
      return NextResponse.json({ 
        error: "Categories are required",
        details: "Please select at least one category"
      }, { status: 400 })
    }

    const supplierData = {
      name: payload.shortName || payload.companyName,
      email: payload.contactEmail || "",
      phone: payload.contactPhone || "",
      address: payload.address || "",
      contact_person: payload.contactPerson || "",
      categories: payload.categories || [],
      status: payload.status || "active",
      notes: payload.notes || "",
    }

    const { data: supplier, error } = await supabase.from("suppliers").insert(supplierData).select().single()

    if (error) {
      console.error("Error creating supplier:", error)
      
      // Обработка специфических ошибок базы данных
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: "Supplier already exists",
          details: "A supplier with this name already exists"
        }, { status: 400 })
      }
      
      if (error.code === '23502') {
        return NextResponse.json({ 
          error: "Missing required fields",
          details: "Some required fields are missing"
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: "Failed to create supplier",
        details: error.message || "Database error occurred"
      }, { status: 500 })
    }

    const responseData = {
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

    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error("Error in suppliers POST:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: "An unexpected error occurred while creating the supplier"
    }, { status: 500 })
  }
}
