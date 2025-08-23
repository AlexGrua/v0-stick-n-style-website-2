import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const fallbackAbout = {
  title: "About Us",
  seoTitle: "About Us - Stick'N'Style",
  heroTitle: "About Stick'N'Style",
  companyStory: "Founded with a passion for innovative interior design.",
  mission: "To provide high-quality, innovative interior solutions.",
}

async function initializeDatabase() {
  const supabase = createClient()

  if ((supabase as any).from("x").select === undefined) return

  try {
    const { error: checkError } = await supabase.from("site_settings").select("key").limit(1)

    if (checkError && checkError.message.includes("does not exist")) {
      const { error: createError } = await (supabase as any).rpc("exec_sql", {
        sql: `
          CREATE TABLE IF NOT EXISTS site_settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(255) UNIQUE NOT NULL,
            data JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          INSERT INTO site_settings (key, data) VALUES
          ('about', '{"title": "About Us", "seoTitle": "About Us - Stick''N''Style", "heroTitle": "About Stick''N''Style", "companyStory": "Founded with a passion for innovative interior design.", "mission": "To provide high-quality, innovative interior solutions."}')
          ON CONFLICT (key) DO NOTHING;
        `,
      })

      if (createError) {
        console.error("Error creating site_settings table:", createError)
      }
    }
  } catch (error) {
    console.error("Database initialization error:", error)
  }
}

export async function GET() {
  try {
    await initializeDatabase()

    const supabase = createClient()

    if ((supabase as any).from("x").select === undefined) {
      return NextResponse.json(fallbackAbout)
    }

    const { data, error } = await supabase.from("site_settings").select("data").eq("key", "about").single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json(data?.data || fallbackAbout)
  } catch (error) {
    console.error("Error loading about page:", error)
    return NextResponse.json(fallbackAbout)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createClient()

    if ((supabase as any).from("x").select === undefined) {
      // No-op in fallback mode
      return NextResponse.json({ success: true })
    }

    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "about",
        data: body,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      },
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving about page:", error)
    return NextResponse.json({ success: false, error: "Failed to save about page" }, { status: 500 })
  }
}
