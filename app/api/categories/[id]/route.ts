import { NextResponse } from "next/server"
import { getCategoryById, updateCategory, deleteCategory } from "@/lib/db"
import { requireRole } from "@/lib/api/guard"

function toSlug(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback UUID generation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[v0] Getting category with ID:", id)
    const category = await getCategoryById(id)
    if (!category) {
      console.log("[v0] Category not found:", id)
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    console.log("[v0] Category found:", category)
    return NextResponse.json(category)
  } catch (error) {
    console.error("[v0] Error fetching category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = requireRole(req, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const { id } = await params
    console.log("[v0] Starting PUT request for category ID:", id)

    const patch = await req.json().catch((err) => {
      console.error("[v0] Error parsing JSON:", err)
      return {}
    })
    console.log("[v0] Received patch data:", patch)

    if (patch?.name && !patch?.slug) {
      patch.slug = toSlug(String(patch.name))
      console.log("[v0] Generated slug:", patch.slug)
    }

    // Убираем обработку subs - они управляются через отдельный API
    if (patch?.subs) {
      console.log("[v0] Ignoring subs in category update - use /api/categories/[id]/subcategories instead")
      delete patch.subs
    }

    console.log("[v0] Calling updateCategory with:", id, patch)
    const updatedCategory = await updateCategory(id, patch)
    console.log("[v0] Category updated successfully:", updatedCategory)

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error("[v0] Error updating category:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = requireRole(req, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const { id } = await params
    const success = await deleteCategory(id)

    if (!success) {
      return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
