import { NextResponse } from "next/server"
import { getCategoryById, updateCategory, deleteCategory } from "@/lib/db"

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

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Getting category with ID:", params.id)
    const category = await getCategoryById(params.id)
    if (!category) {
      console.log("[v0] Category not found:", params.id)
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    console.log("[v0] Category found:", category)
    return NextResponse.json(category)
  } catch (error) {
    console.error("[v0] Error fetching category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Starting PUT request for category ID:", params.id)

    const patch = await req.json().catch((err) => {
      console.error("[v0] Error parsing JSON:", err)
      return {}
    })
    console.log("[v0] Received patch data:", patch)

    if (patch?.name && !patch?.slug) {
      patch.slug = toSlug(String(patch.name))
      console.log("[v0] Generated slug:", patch.slug)
    }

    if (Array.isArray(patch?.subs)) {
      console.log("[v0] Processing subs array:", patch.subs)
      patch.subs = patch.subs.map((s: any) => {
        if (typeof s === "string") {
          return { id: generateUUID(), name: s }
        }
        if (typeof s === "object" && s.name && !s.id) {
          return { ...s, id: generateUUID() }
        }
        return s
      })
      console.log("[v0] Processed subs:", patch.subs)
    }

    console.log("[v0] Calling updateCategory with:", params.id, patch)
    const updatedCategory = await updateCategory(params.id, patch)
    console.log("[v0] Category updated successfully:", updatedCategory)

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error("[v0] Error updating category:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const success = await deleteCategory(params.id)

    if (!success) {
      return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
