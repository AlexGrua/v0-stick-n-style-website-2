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
    
    // Check if Supabase is available
    if ((supabase as any).from("x").select === undefined) {
      console.log("[v0] Supabase not available, returning empty result")
      return NextResponse.json({ items: [], total: 0 })
    }

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
      try {
        const { data: categoryData } = await supabase
          .from("categories")
          .select("id")
          .or(`slug.eq.${category},name.eq.${category}`)
          .single()

        if (categoryData) {
          query = query.eq("category_id", categoryData.id)
        }
      } catch (categoryError) {
        console.error("[v0] Error fetching category:", categoryError)
        // Continue without category filter
      }
    }

    console.log("[v0] Executing products query...")
    
    // Add timeout for the query (reduced to 10 seconds)
    const queryPromise = query
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 10000)
    )
    
    let products, error
    try {
      const result = await Promise.race([queryPromise, timeoutPromise]) as any
      products = result.data
      error = result.error
    } catch (timeoutError) {
      console.error("[v0] Query timeout, returning empty result:", timeoutError)
      return NextResponse.json({ items: [], total: 0 })
    }

    if (error) {
      console.error("[v0] Error fetching products:", error)
      return NextResponse.json({ items: [], total: 0 })
    }

    console.log("[v0] Raw products fetched:", products?.length || 0)

    let supplierMap = new Map()
    try {
      const { data: suppliers } = await supabase.from("suppliers").select("id, name")
      supplierMap = new Map(suppliers?.map((s) => [s.id, s.name]) || [])
    } catch (supplierError) {
      console.error("[v0] Error fetching suppliers:", supplierError)
      // Continue without suppliers
    }

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

      // Extract all sizes and thicknesses for backward compatibility
      const allSizes = techSpecs.map((spec: any) => spec.size).filter(Boolean)
      const allThickness = techSpecs
        .flatMap((spec: any) => spec.thicknesses?.map((t: any) => t.thickness) || [])
        .filter(Boolean)

      // Calculate average pcsPerBox, boxKg, boxM3 from technical specs
      let avgPcsPerBox = 0
      let avgBoxKg = 0
      let avgBoxM3 = 0
      let totalThicknesses = 0

      techSpecs.forEach((spec: any) => {
        spec.thicknesses?.forEach((thickness: any) => {
          avgPcsPerBox += thickness.pcsPerBox || 0
          avgBoxKg += thickness.boxWeight || 0
          avgBoxM3 += thickness.boxVolume || 0
          totalThicknesses++
        })
      })

      if (totalThicknesses > 0) {
        avgPcsPerBox = Math.round(avgPcsPerBox / totalThicknesses)
        avgBoxKg = Math.round((avgBoxKg / totalThicknesses) * 100) / 100
        avgBoxM3 = Math.round((avgBoxM3 / totalThicknesses) * 1000) / 1000
      }

      return {
        ...product,
        thumbnailUrl: product.image_url || "",
        status: product.in_stock ? "active" : "inactive",
        updatedAt: product.updated_at,
        sku: specs.sku || `Product-${product.id}`,
        sub: subcategoryName,
        supplier: supplierName,
        // Structured data for forms and detailed views
        technicalSpecifications: techSpecs,
        colorVariants: colorVariants,
        // Legacy fields for backward compatibility
        sizes: allSizes,
        thickness: allThickness,
        colorCount: colorVariants.length,
        specsCount: Object.keys(specs.productSpecifications || {}).length,
        pcsPerBox: avgPcsPerBox || specs.pcsPerBox || 0,
        boxKg: avgBoxKg || specs.boxKg || 0,
        boxM3: avgBoxM3 || specs.boxM3 || 0,
        technicalDescription: specs.technicalDescription || "",
        minOrderBoxes: specs.minOrderBoxes || 1,
        category: product.categories?.name || "",
        categorySlug: product.categories?.slug || "",
        // Additional structured fields
        productSpecifications: specs.productSpecifications || {},
        interiorApplications: specs.interiorApplications || [],
        installationNotes: specs.installationNotes || "",
      }
    })

    console.log("[v0] Mapped products for frontend:", mappedProducts.length)

    return NextResponse.json({ items: mappedProducts, total: mappedProducts.length })
  } catch (error) {
    console.error("[v0] Error in products GET:", error)
    // Return empty result instead of error to prevent page crashes
    return NextResponse.json({ items: [], total: 0 })
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
