import { NextResponse } from "next/server"
import { listSuppliers, createSupplier, type Supplier } from "@/lib/suppliers-store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || undefined
  const statusParam = searchParams.get("status") || undefined
  const status = (statusParam as any) || undefined
  const data = listSuppliers({ search, status })
  return NextResponse.json(data, { status: 200 })
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Supplier
    const created = createSupplier(payload)
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 400 })
  }
}
