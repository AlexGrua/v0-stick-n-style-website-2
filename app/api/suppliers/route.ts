import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    const mappedSuppliers = (suppliers || []).map((supplier) => ({
      id: supplier.id,
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
    const payload = await request.json()

    if (!payload.companyName && !payload.shortName) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    const supplierData = {
      name: payload.shortName || payload.companyName,
      email: payload.contactEmail || "",
      phone: payload.contactPhone || "",
      address: payload.address || "",
      contact_person: payload.contactPerson || "",
      categories: payload.categories || [],
      status: payload.status || "pending",
      notes: payload.notes || "",
    }

    const { data: supplier, error } = await supabase.from("suppliers").insert(supplierData).select().single()

    if (error) {
      console.error("Error creating supplier:", error)
      return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 })
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
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 })
  }
}
