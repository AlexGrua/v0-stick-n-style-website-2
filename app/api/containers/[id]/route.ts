import { type NextRequest, NextResponse } from "next/server"
import { db, seed } from "@/lib/db"
import type { Container } from "@/lib/types"
import { requireRole } from "@/lib/api/guard"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireRole(req, "admin")
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status })
  }

  seed()
  const state = db()
  const idx = state.containers.findIndex((c) => c.id === params.id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const body = await req.json()
  const now = new Date().toISOString()
  const updated: Container = {
    ...state.containers[idx],
    ...body,
    capacityKg: Number(body.capacityKg ?? state.containers[idx].capacityKg),
    capacityM3: Number(body.capacityM3 ?? state.containers[idx].capacityM3),
    updatedAt: now,
  }
  state.containers[idx] = updated
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireRole(req, "admin")
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status })
  }

  seed()
  const state = db()
  const idx = state.containers.findIndex((c) => c.id === params.id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
  state.containers.splice(idx, 1)
  return NextResponse.json({ ok: true })
}
