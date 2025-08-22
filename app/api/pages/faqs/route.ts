import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const supabase = createClient()

export async function GET() {
  try {
    const { data, error } = await supabase.from("site_settings").select("data").eq("key", "faqs").single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json({
      data: data?.data || {
        pageTitle: "FAQs",
        seoTitle: "Frequently Asked Questions - Stick'N'Style",
        description: "Find answers to common questions about our products and services",
        seoDescription:
          "Get answers to frequently asked questions about Stick'N'Style wall panels, flooring, and installation services",
        heroTitle: "Frequently Asked Questions",
        heroSubtitle: "Everything you need to know about our products and services",
        faqs: [],
      },
    })
  } catch (error) {
    console.error("Error loading FAQs page:", error)
    return NextResponse.json({ error: "Failed to load FAQs page" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { data } = await request.json()

    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "faqs",
        data: data,
      },
      {
        onConflict: "key",
      },
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving FAQs page:", error)
    return NextResponse.json({ error: "Failed to save FAQs page" }, { status: 500 })
  }
}
