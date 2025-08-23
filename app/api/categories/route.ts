import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function toSlug(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET() {
  try {
    const supabase = createClient()
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      return NextResponse.json({ items: [], total: 0 })
    }

    return NextResponse.json({ items: categories || [], total: (categories || []).length })
  } catch (error) {
    console.error("Error in categories GET:", error)
    return NextResponse.json({ items: [], total: 0 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const body = await req.json().catch(() => ({}))

    const name: string = (body.name || "").trim()
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    let slug = body.slug || toSlug(name)

    // Ensure unique slug
    const { data: existingCategory } = await supabase.from("categories").select("slug").eq("slug", slug).single()

    if (existingCategory) {
      let i = 2
      let uniqueSlug = `${slug}-${i}`
      while (true) {
        const { data: existing } = await supabase.from("categories").select("slug").eq("slug", uniqueSlug).single()

        if (!existing) break
        i++
        uniqueSlug = `${slug}-${i}`
      }
      slug = uniqueSlug
    }

    const description: string = body.description || ""
    const image_url: string = body.image_url || ""
    const subs = Array.isArray(body.subs) ? body.subs : []

    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        name,
        slug,
        description,
        image_url,
        subs,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating category:", error)
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
    }

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Error in categories POST:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
