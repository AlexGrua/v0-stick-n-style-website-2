import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/api/guard"

const memStore: Record<string, any> = {}

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const supabase = createClient()
    const { key } = await params

    if ((supabase as any).from("x").select === undefined) {
      // Dummy client: use memory
      if (key === "navigation") {
        const data = memStore["navigation"] || { 
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
          showCreateNOrder: true,
        }
        return NextResponse.json({ success: true, data })
      }
      return NextResponse.json({ success: true, data: memStore[key] || {} })
    }

    if (key === "navigation") {
      try {
        // Add timeout for Supabase queries
        const navPromise = supabase
          .from("site_settings")
          .select("data")
          .eq("key", "navigation")
          .single()

        const switcherPromise = supabase
          .from("site_settings")
          .select("data")
          .eq("key", "language_switcher_visible")
          .single()

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Navigation query timeout')), 5000)
        )

        const [navResult, switcherResult] = await Promise.race([
          Promise.all([navPromise, switcherPromise]),
          timeoutPromise
        ]) as any

        const { data: navData, error: navError } = navResult
        const { data: switcherData, error: switcherError } = switcherResult

        if (navError && navError.code !== "PGRST116") throw navError
        if (switcherError && switcherError.code !== "PGRST116") throw switcherError

        const navigationData = navData?.data || {}
        const navToggle = (navigationData as any).showLanguageSwitcher
        const switcherVisible = typeof navToggle === "boolean" ? navToggle : switcherData?.data?.visible !== false

        return NextResponse.json({
          success: true,
          data: { ...navigationData, showLanguageSwitcher: switcherVisible },
        })
      } catch (dbError) {
        console.error("Database error for navigation, using fallback:", dbError)
        // Fallback to memory store
        const data = memStore["navigation"] || { 
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
          showCreateNOrder: true,
        }
        return NextResponse.json({ success: true, data })
      }
    }

    try {
      // Add timeout for Supabase query
      const queryPromise = supabase.from("site_settings").select("data").eq("key", key).single()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      )

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

      if (error && error.code !== "PGRST116") {
        throw error
      }

      return NextResponse.json({ success: true, data: data?.data || {} })
    } catch (dbError) {
      console.error("Database error for key", key, ", using fallback:", dbError)
      return NextResponse.json({ success: true, data: memStore[key] || {} })
    }
  } catch (error) {
    const { key } = await params
    console.error(`Error loading ${key}:`, error)
    return NextResponse.json({ success: true, data: memStore[key] || {} })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const guard = requireRole(request, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const supabase = createClient()
    const { key } = await params
    const requestData = await request.json()

    if ((supabase as any).from("x").select === undefined) {
      memStore[key] = requestData
      return NextResponse.json({ success: true })
    }

    try {
      // Add timeout for Supabase upsert
      const upsertPromise = supabase.from("site_settings").upsert(
        { key, data: requestData, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      )
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upsert timeout')), 5000)
      )

      const { error } = await Promise.race([upsertPromise, timeoutPromise]) as any

      if (error) throw error

      return NextResponse.json({ success: true })
    } catch (dbError) {
      console.error("Database error for saving key", key, ", using memory store:", dbError)
      memStore[key] = requestData
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    const { key } = await params
    console.error(`Error saving ${key}:`, error)
    memStore[key] = memStore[key] || {}
    return NextResponse.json({ success: false, error: "Failed to save data" }, { status: 500 })
  }
}
