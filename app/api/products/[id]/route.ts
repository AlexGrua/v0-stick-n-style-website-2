import { NextResponse } from "next/server"
import { db, seed } from "@/lib/db"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  seed()
  const { products } = db()
  const item = products.find((p) => p.id === params.id)
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  seed()
  const state = db()
  const idx = state.products.findIndex((p) => p.id === params.id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const patch = await req.json().catch(() => ({}))
  const now = new Date().toISOString()
  state.products[idx] = { ...state.products[idx], ...patch, updatedAt: now }
  return NextResponse.json(state.products[idx])
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  seed()
  const state = db()
  const idx = state.products.findIndex((p) => p.id === params.id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
  state.products.splice(idx, 1)
  return new NextResponse(null, { status: 204 })
}
