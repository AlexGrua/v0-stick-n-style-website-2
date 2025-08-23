import { NextResponse } from "next/server"
import { getHomePageData, saveHomePageData } from "@/lib/db"
import { requireRole } from "@/lib/api/guard"

export async function GET() {
  try {
    const homePage = await getHomePageData()
    return NextResponse.json(homePage)
  } catch (error) {
    console.error("Error in GET /api/home-page:", error)
    return NextResponse.json({ error: "Failed to fetch home page data" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const guard = requireRole(req, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const updates = await req.json()
    const now = new Date().toISOString()

    // Получаем текущие данные
    const currentData = await getHomePageData()
    if (!currentData) {
      return NextResponse.json({ error: "Failed to load current data" }, { status: 500 })
    }

    // Обновляем данные
    const updatedData = {
      ...currentData,
      ...updates,
      updatedAt: now,
    }

    // Сохраняем в Supabase
    const success = await saveHomePageData(updatedData)
    if (!success) {
      return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
    }

    return NextResponse.json(updatedData)
  } catch (error) {
    console.error("Error in PUT /api/home-page:", error)
    return NextResponse.json({ error: "Invalid JSON data" }, { status: 400 })
  }
}

export async function PATCH(req: Request) {
  try {
    const guard = requireRole(req, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const { blockType, blockData } = await req.json()
    const now = new Date().toISOString()

    // Получаем текущие данные
    const currentData = await getHomePageData()
    if (!currentData) {
      return NextResponse.json({ error: "Failed to load current data" }, { status: 500 })
    }

    // Обновляем конкретный блок
    if (blockType && blockData) {
      const updatedData = {
        ...currentData,
        [blockType]: blockData,
        updatedAt: now,
      }

      // Сохраняем в Supabase
      const success = await saveHomePageData(updatedData)
      if (!success) {
        return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
      }

      return NextResponse.json(updatedData)
    }

    return NextResponse.json({ error: "Missing blockType or blockData" }, { status: 400 })
  } catch (error) {
    console.error("Error in PATCH /api/home-page:", error)
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
  }
}
