import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// In-memory fallback for local dev when Supabase is not configured
const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
const memoryStore: { [key: string]: any } = globalThis.__SITE_SETTINGS__ || {}
// @ts-expect-error attach to global for local-only fallback
if (!globalThis.__SITE_SETTINGS__) globalThis.__SITE_SETTINGS__ = memoryStore

const defaultNavigation = {
  mainMenu: [
    { id: "home", href: "/", label: "Home", visible: true, order: 1, type: "link" },
    { id: "about", href: "/about", label: "About us", visible: true, order: 2, type: "link" },
    { id: "catalog", href: "/catalog", label: "Catalog", visible: true, order: 3, type: "link" },
    { id: "faqs", href: "/faqs", label: "FAQs", visible: true, order: 4, type: "link" },
    { id: "contact", href: "/contact", label: "Contact Us", visible: true, order: 5, type: "link" },
  ],
  showLanguageSwitcher: true,
  showLoginButton: true,
  showCartButton: true,
}

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const { key } = params

    // Fallback path without Supabase
    if (!hasSupabase) {
      if (key === "navigation") {
        const nav = memoryStore.navigation ?? defaultNavigation
        return NextResponse.json({ success: true, data: nav })
      }
      const val = memoryStore[key] ?? {}
      return NextResponse.json({ success: true, data: val })
    }

    const supabase = createClient()

    if (key === "navigation") {
      // Get navigation data
      const { data: navData, error: navError } = await supabase
        .from("site_settings")
        .select("data")
        .eq("key", "navigation")
        .single()

      const { data: switcherData, error: switcherError } = await supabase
        .from("site_settings")
        .select("data")
        .eq("key", "language_switcher_visible")
        .single()

      if (navError && navError.code !== "PGRST116") throw navError
      if (switcherError && switcherError.code !== "PGRST116") throw switcherError

      const navigationData = navData?.data || {}
      // Check if data exists and is explicitly false, otherwise default to true
      const switcherVisible = switcherData && switcherData.data === false ? false : true

      return NextResponse.json({
        success: true,
        data: {
          ...navigationData,
          showLanguageSwitcher: switcherVisible,
        },
      })
    }

    const { data, error } = await supabase.from("site_settings").select("data").eq("key", key).single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data?.data || {},
    })
  } catch (error) {
    console.error(`Error loading ${params.key}:`, error)
    return NextResponse.json({ success: false, error: "Failed to load data" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const { key } = params
    const requestData = await request.json()

    if (!hasSupabase) {
      memoryStore[key] = requestData
      return NextResponse.json({ success: true })
    }

    const supabase = createClient()

    const { error } = await supabase.from("site_settings").upsert(
      {
        key,
        data: requestData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      },
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error saving ${params.key}:`, error)
    return NextResponse.json({ success: false, error: "Failed to save data" }, { status: 500 })
  }
}
