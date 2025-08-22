import { NextResponse } from "next/server"
import { getSupplier, updateSupplier, deleteSupplier, type Supplier } from "@/lib/suppliers-store"

type RouteContext = { params: { id: string } }

export async function GET(_req: Request, ctx: RouteContext) {
  const item = getSupplier(ctx.params.id)
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(item, { status: 200 })
}

export async function PUT(request: Request, ctx: RouteContext) {
  try {
    const patch = (await request.json()) as Partial<Supplier>
    const updated = updateSupplier(ctx.params.id, patch)
    return NextResponse.json(updated, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 400 })
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  try {
    const res = deleteSupplier(ctx.params.id)
    return NextResponse.json(res, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 400 })
  }
}
