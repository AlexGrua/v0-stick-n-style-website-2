import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/api/guard"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = requireRole(request, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    console.log("[v0] PUT language request started for ID:", params.id)

    const supabase = createClient()
    const body = await request.json()
    const { code, name, flag_icon } = body

    console.log("[v0] Updating language with data:", { code, name, flag_icon })

    // Update the language
    const { data, error } = await supabase
      .from("languages")
      .update({ code, name, flag_icon })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating language:", error)
      return NextResponse.json({ success: false, error: "Failed to update language" }, { status: 500 })
    }

    console.log("[v0] Language updated successfully:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Update language error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = requireRole(request, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    console.log("[v0] DELETE language request started for ID:", params.id)

    const supabase = createClient()

    // Check if this is the default language
    const { data: language, error: fetchError } = await supabase
      .from("languages")
      .select("is_default, is_active")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching language:", fetchError)
      return NextResponse.json({ success: false, error: "Language not found" }, { status: 404 })
    }

    if (language.is_default) {
      return NextResponse.json({ success: false, error: "Cannot delete default language" }, { status: 400 })
    }

    // Check if this is the last active language
    const { data: activeLanguages, error: countError } = await supabase
      .from("languages")
      .select("id")
      .eq("is_active", true)

    if (countError) {
      console.error("[v0] Error counting active languages:", countError)
      return NextResponse.json({ success: false, error: "Failed to check active languages" }, { status: 500 })
    }

    if (activeLanguages.length === 1 && language.is_active) {
      return NextResponse.json({ success: false, error: "Cannot delete the last active language" }, { status: 400 })
    }

    // Delete the language
    const { error: deleteError } = await supabase.from("languages").delete().eq("id", params.id)

    if (deleteError) {
      console.error("[v0] Error deleting language:", deleteError)
      return NextResponse.json({ success: false, error: "Failed to delete language" }, { status: 500 })
    }

    console.log("[v0] Language deleted successfully:", params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete language error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
