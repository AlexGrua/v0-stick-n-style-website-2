import { type NextRequest, NextResponse } from "next/server"
import { db, seed } from "@/lib/db"
import type { Attribute } from "@/lib/types"
import { requireRole } from "@/lib/api/guard"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireRole(req, "admin")
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status })
  }

  seed()
  const state = db()
  const idx = state.attributes.findIndex((a) => a.id === params.id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const body = await req.json()
  const now = new Date().toISOString()
  const updated: Attribute = {
    ...state.attributes[idx],
    ...body,
    min: body.min !== undefined ? Number(body.min) : state.attributes[idx].min,
    max: body.max !== undefined ? Number(body.max) : state.attributes[idx].max,
    step: body.step !== undefined ? Number(body.step) : state.attributes[idx].step,
    updatedAt: now,
  }
  state.attributes[idx] = updated
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireRole(req, "admin")
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status })
  }

  seed()
  const state = db()
  const idx = state.attributes.findIndex((a) => a.id === params.id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
  state.attributes.splice(idx, 1)
  return NextResponse.json({ ok: true })
}
