import { NextResponse } from "next/server"
import { getHomePageData, saveHomePageData } from "@/lib/db"
import { requireRole } from "@/lib/api/guard"

export async function GET() {
  try {
    console.log("[v0] GET /api/home-page - starting...")
    const homePage = await getHomePageData()
    console.log("[v0] GET /api/home-page - data loaded, hero backgroundImage:", homePage?.hero?.backgroundImage)
    console.log("[v0] GET /api/home-page - data loaded, hero images:", homePage?.hero?.images)
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

    console.log("[v0] PUT /api/home-page - received updates:", JSON.stringify(updates, null, 2))

    // Получаем текущие данные
    const currentData = await getHomePageData()
    if (!currentData) {
      return NextResponse.json({ error: "Failed to load current data" }, { status: 500 })
    }

    console.log("[v0] PUT /api/home-page - current data:", JSON.stringify(currentData, null, 2))

    // Обновляем данные
    const updatedData = {
      ...currentData,
      ...updates,
      updatedAt: now,
    }

    console.log("[v0] PUT /api/home-page - updated data:", JSON.stringify(updatedData, null, 2))

    // Сохраняем в Supabase
    const success = await saveHomePageData(updatedData)
    if (!success) {
      return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
    }

    console.log("[v0] PUT /api/home-page - data saved successfully")
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
