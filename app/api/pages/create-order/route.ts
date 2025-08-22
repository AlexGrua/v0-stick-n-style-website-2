import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const supabase = createClient()

export async function GET() {
  try {
    const { data, error } = await supabase.from("site_settings").select("data").eq("key", "create-order").single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json({
      data: data?.data || {
        pageTitle: "Create'N'Order",
        seoTitle: "Custom Order Service - Stick'N'Style",
        description: "Create your custom order with our expert consultation service",
        seoDescription: "Get personalized consultation and custom orders for wall panels and flooring solutions",
        heroTitle: "Create Your Custom Order",
        heroSubtitle: "Get expert consultation and personalized solutions for your space",
        features: [
          "Free consultation with design experts",
          "Custom measurements and planning",
          "Professional installation service",
          "Quality guarantee on all products",
        ],
        formSettings: {
          enableFileUpload: true,
          enableMeasurements: true,
          enableRoomType: true,
          enableDeadline: true,
          requirePhone: true,
          requireAddress: false,
        },
        thankYouMessage: "Thank you for your order request! Our team will contact you within 24 hours.",
      },
    })
  } catch (error) {
    console.error("Error loading Create Order page:", error)
    return NextResponse.json({ error: "Failed to load Create Order page" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { data } = await request.json()

    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "create-order",
        data: data,
      },
      {
        onConflict: "key",
      },
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving Create Order page:", error)
    return NextResponse.json({ error: "Failed to save Create Order page" }, { status: 500 })
  }
}
