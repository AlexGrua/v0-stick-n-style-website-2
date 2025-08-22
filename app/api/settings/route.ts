import { type NextRequest, NextResponse } from "next/server"
import { db, seed } from "@/lib/db"
import type { Settings } from "@/lib/types"

export async function GET() {
  seed()
  const { settings } = db()
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  seed()
  const state = db()
  const body = await req.json()
  const now = new Date().toISOString()
  const updated: Settings = {
    ...state.settings,
    ...body,
    exportColumns: Array.isArray(body.exportColumns) ? body.exportColumns : state.settings.exportColumns,
    updatedAt: now,
    showLanguageSwitcher: typeof body.showLanguageSwitcher === "boolean" ? body.showLanguageSwitcher : state.settings.showLanguageSwitcher,
  }
  state.settings = updated
  return NextResponse.json(updated)
}
