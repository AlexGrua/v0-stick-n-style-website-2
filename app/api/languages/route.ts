import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function fallbackLanguages() {
  return [
    { id: "en", code: "en", name: "English", native_name: "English", flag_icon: "🌐", is_active: true, is_default: true },
    { id: "ru", code: "ru", name: "Русский", native_name: "Русский", flag_icon: "🇷🇺", is_active: true, is_default: false },
    { id: "zh", code: "zh", name: "中文", native_name: "中文", flag_icon: "🇨🇳", is_active: true, is_default: false },
  ]
}

export async function GET() {
  try {
    console.log("[v0] GET languages request started")
    const supabase = createClient()

    const { data: languages, error } = await supabase.from("languages").select("*").order("name")

    if (error) {
      console.log("[v0] Error fetching languages:", error)
      return NextResponse.json({ success: true, data: fallbackLanguages(), note: "fallback" })
    }

    console.log("[v0] Languages fetched:", languages?.length || 0)
    return NextResponse.json({ success: true, data: languages })
  } catch (error) {
    console.error("[v0] Languages API error:", error)
    return NextResponse.json({ success: true, data: fallbackLanguages(), note: "fallback" })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] POST languages request started")
    const body = await request.json()
    const supabase = createClient()

    const { data, error } = await supabase.from("languages").insert([body]).select().single()

    if (error) {
      console.log("[v0] Error creating language:", error)
      throw error
    }

    console.log("[v0] Language created:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Create language error:", error)
    return NextResponse.json({ success: false, error: "Failed to create language" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] PUT languages request started")
    const body = await request.json()
    const { languages, showLanguageSwitcher } = body
    const supabase = createClient()

    // Update languages
    for (const language of languages) {
      const { error } = await supabase
        .from("languages")
        .update({
          is_active: language.isActive,
          is_default: language.isDefault,
        })
        .eq("id", language.id)

      if (error) {
        console.log("[v0] Error updating language:", error)
        throw error
      }
    }

    // Check if language switcher setting exists
    const { data: existingSetting } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", "language_switcher_visible")
      .single()

    if (existingSetting) {
      const { error: settingsError } = await supabase
        .from("site_settings")
        .update({ data: { visible: showLanguageSwitcher } })
        .eq("key", "language_switcher_visible")

      if (settingsError) {
        console.log("[v0] Error updating language switcher settings:", settingsError)
        throw settingsError
      }
    } else {
      const { error: settingsError } = await supabase.from("site_settings").insert({
        key: "language_switcher_visible",
        data: { visible: showLanguageSwitcher },
      })

      if (settingsError) {
        console.log("[v0] Error inserting language switcher settings:", settingsError)
        throw settingsError
      }
    }

    console.log("[v0] Languages updated successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update languages error:", error)
    return NextResponse.json({ success: false, error: "Failed to update languages" }, { status: 500 })
  }
}
