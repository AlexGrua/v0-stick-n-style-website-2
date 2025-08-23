import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/api/guard"

function toSlug(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function generateUniqueSlug(baseSlug: string, supabase: any): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const { data: existingProduct } = await supabase.from("products").select("id").eq("slug", slug).single()

    if (!existingProduct) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

export async function GET(req: Request) {
  try {
    const supabase = createClient()
    console.log("[v0] GET products request started")

    const url = new URL(req.url)
    const q = (url.searchParams.get("q") || "").trim().toLowerCase()
    const category = (url.searchParams.get("category") || "").trim()
    const includeInactive = url.searchParams.get("includeInactive") !== "false"

    console.log("[v0] Query params:", { q, category, includeInactive })

    let query = supabase.from("products").select(`
        *,
        categories (
          id,
          name,
          slug,
          subs
        )
      `)

    if (!includeInactive) {
      query = query.eq("in_stock", true)
    }

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,specifications->>sku.ilike.%${q}%`)
    }

    if (category) {
      const { data: categoryData } = await supabase
        .from("categories")
        .select("id")
        .or(`slug.eq.${category},name.eq.${category}`)
        .single()

      if (categoryData) {
        query = query.eq("category_id", categoryData.id)
      }
    }

    console.log("[v0] Executing products query...")
    const { data: products, error } = await query

    if (error) {
      console.error("[v0] Error fetching products:", error)
      return NextResponse.json({ items: [], total: 0 })
    }

    console.log("[v0] Raw products fetched:", products?.length || 0)

    const { data: suppliers } = await supabase.from("suppliers").select("id, name")
    const supplierMap = new Map(suppliers?.map((s) => [s.id, s.name]) || [])

    const mappedProducts = (products || []).map((product: any) => {
      const specs = product.specifications || {}

      let subcategoryName = ""
      if (specs.sub && product.categories?.subs) {
        const subcategory = product.categories.subs.find((sub: any) => sub.id === specs.sub)
        subcategoryName = subcategory?.name || ""
      }

      const supplierName = specs.supplierId ? supplierMap.get(specs.supplierId) || `Supplier ${specs.supplierId}` : ""

      const techSpecs = specs.technicalSpecifications || []
      const colorVariants = specs.colorVariants || []

      const allSizes = techSpecs.map((spec: any) => spec.size).filter(Boolean)
      const allThickness = techSpecs
        .flatMap((spec: any) => spec.thicknesses?.map((t: any) => t.thickness) || [])
        .filter(Boolean)

      return {
        ...product,
        thumbnailUrl: product.image_url || "",
        status: product.in_stock ? "active" : "inactive",
        updatedAt: product.updated_at,
        sku: specs.sku || `Product-${product.id}`,
        sub: subcategoryName,
        supplier: supplierName,
        sizes: allSizes.length > 0 ? allSizes.join(", ") : "-",
        thickness: allThickness.length > 0 ? allThickness.join(", ") : "-",
        colorCount: colorVariants.length,
        specsCount: Object.keys(specs.productSpecifications || {}).length,
        pcsPerBox: specs.pcsPerBox || 0,
        boxKg: specs.boxKg || 0,
        boxM3: specs.boxM3 || 0,
        technicalDescription: specs.technicalDescription || "",
        minOrderBoxes: specs.minOrderBoxes || 1,
        category: product.categories?.name || "",
        categorySlug: product.categories?.slug || "",
      }
    })

    console.log("[v0] Mapped products for frontend:", mappedProducts.length)

    return NextResponse.json({ items: mappedProducts, total: mappedProducts.length })
  } catch (error) {
    console.error("[v0] Error in products GET:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        details: error instanceof Error ? error.message : "Unknown error",
        items: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const guard = requirePermission(req, "products.create")
    if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status })

    const supabase = createClient()
    const body = await req.json().catch(() => ({}))

    if (!body.category_id) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 })
    }

    const { data: categoryExists, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", body.category_id)
      .single()

    if (categoryError || !categoryExists) {
      console.error("Category not found:", body.category_id, categoryError)
      return NextResponse.json({ error: "Selected category does not exist" }, { status: 400 })
    }

    const name: string = body.name || "New Product"
    const description: string = body.description || ""
    const price: number = body.price || 0
    const category_id: number = body.category_id
    const baseSlug: string = body.slug || toSlug(name)
    const slug: string = await generateUniqueSlug(baseSlug, supabase)
    const sku: string = body.sku || ""

    const image_url: string = body.thumbnailUrl || body.image_url || ""
    const images: any = body.images || []

    const specifications: any = {
      sku: sku,
      sub: body.specifications?.sub || body.subcategory_id || "",
      supplierId: body.specifications?.supplierId || body.supplier_id || null,
      technicalDescription: body.technicalDescription || "",
      sizes: body.sizes || [],
      thickness: body.thickness || [],
      pcsPerBox: body.pcsPerBox || 0,
      boxKg: body.boxKg || 0,
      boxM3: body.boxM3 || 0,
      minOrderBoxes: body.minOrderBoxes || 1,
      technicalSpecifications: body.technical_specifications || body.specifications?.technicalSpecifications || [],
      colorVariants: body.color_variants || body.specifications?.colorVariants || [],
      productSpecifications: body.specifications?.productSpecifications || {},
      interiorApplications: body.interior_applications || body.specifications?.interiorApplications || [],
      installationNotes: body.installation_notes || "",
      ...body.specifications,
    }

    const in_stock: boolean = body.in_stock !== undefined ? body.in_stock : true

    console.log(
      "[v0] Creating product with category_id:",
      category_id,
      "supplier_id:",
      specifications.supplierId,
      "sku:",
      sku,
    )

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name,
        description,
        price,
        category_id,
        image_url,
        images,
        specifications,
        in_stock,
        slug,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating product:", error)
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
    }

    console.log("[v0] Product created successfully:", product.id)

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error in products POST:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
