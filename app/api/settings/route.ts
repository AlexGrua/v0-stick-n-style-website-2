import { type NextRequest, NextResponse } from "next/server"
import { db, seed } from "@/lib/db"
import type { Settings } from "@/lib/types"
import { requirePermission } from "@/lib/api/guard"

export async function GET() {
  seed()
  const { settings } = db()
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  const guard = requirePermission(req, "settings.edit")
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status })
  }

  seed()
  const state = db()
  const body = await req.json()
  const now = new Date().toISOString()
  const updated: Settings = {
    ...state.settings,
    ...body,
    exportColumns: Array.isArray(body.exportColumns) ? body.exportColumns : state.settings.exportColumns,
    updatedAt: now,
  }
  state.settings = updated
  return NextResponse.json(updated)
}
