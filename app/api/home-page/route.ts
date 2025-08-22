import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const { homePage } = db()
  return NextResponse.json(homePage)
}

export async function PUT(req: Request) {
  const state = db()

  try {
    const updates = await req.json()
    const now = new Date().toISOString()

    // Update home page data
    state.homePage = {
      ...state.homePage,
      ...updates,
      updatedAt: now,
    }

    return NextResponse.json(state.homePage)
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON data" }, { status: 400 })
  }
}

export async function PATCH(req: Request) {
  const state = db()

  try {
    const { blockType, blockData } = await req.json()
    const now = new Date().toISOString()

    // Update specific block
    if (blockType && blockData) {
      state.homePage = {
        ...state.homePage,
        [blockType]: blockData,
        updatedAt: now,
      }
    }

    return NextResponse.json(state.homePage)
  } catch (error) {
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
  }
}
