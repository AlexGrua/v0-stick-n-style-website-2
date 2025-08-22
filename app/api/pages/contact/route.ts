import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function initializeDatabase() {
  const supabase = createClient()

  try {
    // Проверяем существование таблицы
    const { error: checkError } = await supabase.from("site_settings").select("key").limit(1)

    if (checkError && checkError.message.includes("does not exist")) {
      // Создаем таблицу с начальными данными
      const { error: createError } = await supabase.rpc("exec_sql", {
        sql: `
          CREATE TABLE IF NOT EXISTS site_settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(255) UNIQUE NOT NULL,
            data JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          INSERT INTO site_settings (key, data) VALUES
          ('contact', '{"title": "Contact Us", "seoTitle": "Contact Us - Stick''N''Style", "heroTitle": "Get in Touch", "description": "We''d love to hear from you.", "address": "123 Design Street", "phone": "+1 (555) 123-4567", "email": "info@sticknstyle.com"}')
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

    const { data, error } = await supabase.from("site_settings").select("data").eq("key", "contact").single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json(data?.data || {})
  } catch (error) {
    console.error("Error loading contact page:", error)
    return NextResponse.json({ error: "Failed to load contact page" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createClient()

    const { error } = await supabase.from("site_settings").upsert({
      key: "contact",
      data: body,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving contact page:", error)
    return NextResponse.json({ error: "Failed to save contact page" }, { status: 500 })
  }
}
