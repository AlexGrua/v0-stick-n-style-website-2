import { type NextRequest, NextResponse } from "next/server"
import { db, seed } from "@/lib/db"
import type { Container } from "@/lib/types"
import { requireRole } from "@/lib/api/guard"

export async function GET() {
  seed()
  const { containers } = db()
  return NextResponse.json({ items: containers })
}

export async function POST(req: NextRequest) {
  const guard = requireRole(req, "admin")
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status })
  }

  seed()
  const state = db()
  const body = await req.json()
  if (!body.name || !body.code) {
    return NextResponse.json({ error: "name and code are required" }, { status: 400 })
  }
  const now = new Date().toISOString()
  const container: Container = {
    id: crypto.randomUUID(),
    name: body.name,
    code: String(body.code),
    capacityKg: Number(body.capacityKg ?? 0),
    capacityM3: Number(body.capacityM3 ?? 0),
    createdAt: now,
    updatedAt: now,
  }
  state.containers.push(container)
  return NextResponse.json(container, { status: 201 })
}
