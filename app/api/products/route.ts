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
    const subcategory = (url.searchParams.get("subcategory") || "").trim()
    const supplier = (url.searchParams.get("supplier") || "").trim()
    const includeInactive = url.searchParams.get("includeInactive") !== "false"
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    console.log("[v0] Query params:", { q, category, subcategory, supplier, includeInactive, page, limit })

    // Simplified query without JOINs to avoid timeout issues
    let query = supabase.from("products").select("*", { count: "exact" })

    if (!includeInactive) {
      query = query.eq("in_stock", true)
    }

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,sku.ilike.%${q}%`)
    }

    if (category) {
      // Support both category ID and category name/slug
      if (!isNaN(Number(category))) {
        query = query.eq("category_id", Number(category))
      } else {
        try {
          const { data: categoryData } = await supabase
            .from("categories")
            .select("id")
            .or(`name.eq.${category},slug.eq.${category}`)
            .single()

          if (categoryData) {
            query = query.eq("category_id", categoryData.id)
          }
        } catch (categoryError) {
          console.error("[v0] Error fetching category:", categoryError)
        }
      }
    }

    // Временно отключаем фильтр по subcategory
    // if (subcategory) {
    //   // Support both subcategory ID and subcategory name/slug
    //   if (!isNaN(Number(subcategory))) {
    //     query = query.eq("subcategory_id", Number(subcategory))
    //   } else {
    //     try {
    //       const { data: subcategoryData } = await supabase
    //         .from("subcategories")
    //         .select("id")
    //         .or(`name.eq.${subcategory},slug.eq.${subcategory}`)
    //         .single()

    //       if (subcategoryData) {
    //     query = query.eq("subcategory_id", subcategoryData.id)
    //       }
    //     } catch (subcategoryError) {
    //       console.error("[v0] Error fetching subcategory:", subcategoryError)
    //     }
    //   }
    // }

    if (supplier) {
      // Filter by supplier using specifications JSONB
      query = query.filter('specifications->>supplierId', 'eq', supplier)
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    console.log("[v0] Executing products query...")
    
    // Execute query without timeout
    const result = await query
    const error = result.error

    if (error) {
      console.error("[v0] Error fetching products:", error)
      return NextResponse.json({ items: [], total: 0 })
    }

    const products = result.data || []
    const total = result.count || 0

    console.log("[v0] Raw products fetched:", products?.length || 0)

    // Get unique category IDs to fetch category names efficiently
    const categoryIds = [...new Set(products.map((p: any) => p.category_id).filter(Boolean))]
    const categoryMap = new Map()

    if (categoryIds.length > 0) {
      try {
        const { data: categories } = await supabase
          .from("categories")
          .select("id, name, slug")
          .in("id", categoryIds)

        if (categories) {
          categories.forEach((cat: any) => {
            categoryMap.set(cat.id, { name: cat.name, slug: cat.slug })
          })
        }
      } catch (error) {
        console.error("[v0] Error fetching categories:", error)
      }
    }

    // Get unique supplier IDs to fetch supplier names efficiently
    const supplierIds = [...new Set(products.map((p: any) => {
      const specs = p.specifications || {}
      return specs.supplierId
    }).filter(Boolean))]
    const supplierMap = new Map()

    if (supplierIds.length > 0) {
      try {
        const { data: suppliers } = await supabase
          .from("suppliers")
          .select("id, name")
          .in("id", supplierIds)

        if (suppliers) {
          suppliers.forEach((sup: any) => {
            supplierMap.set(sup.id, sup.name)
          })
        }
      } catch (error) {
        console.error("[v0] Error fetching suppliers:", error)
      }
    }

    // Resolve subcategory names/slugs by subcategoryId from specifications
    const subcategoryIds = [
      ...new Set(
        products
          .map((p: any) => (p.specifications || {}).subcategoryId)
          .filter(Boolean),
      ),
    ]
    const subcategoryMap = new Map()

    if (subcategoryIds.length > 0) {
      try {
        const { data: subcategories } = await supabase
          .from("subcategories")
          .select("id, name, slug")
          .in("id", subcategoryIds as any)

        if (subcategories) {
          subcategories.forEach((sc: any) => {
            subcategoryMap.set(sc.id, { name: sc.name, slug: sc.slug })
          })
        }
      } catch (error) {
        console.error("[v0] Error fetching subcategories:", error)
      }
    }

    const mappedProducts = products.map((product: any) => {
      const specs = product.specifications || {}

      // Extract data from actual schema (no JOINs)
      const categoryInfo = {} // Получаем отдельно если нужно
      const subcategoryInfo = {} // Временно отключаем
      const supplierInfo = {} // Получаем из specifications

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

      // Get category info from specifications or category_id
      let categoryName = ""
      let categorySlug = ""
      if (specs.categoryName) {
        categoryName = specs.categoryName
        categorySlug = specs.categorySlug || ""
      } else if (product.category_id && categoryMap.has(product.category_id)) {
        // Get from pre-fetched categories
        const catInfo = categoryMap.get(product.category_id)
        categoryName = catInfo.name
        categorySlug = catInfo.slug
      } else if (product.category_id) {
        // Fallback: try to get from categories table
        categoryName = `Category ${product.category_id}`
        categorySlug = `category-${product.category_id}`
      }

      // Get subcategory info from specifications
      let subcategoryName = ""
      let subcategorySlug = ""
      if (specs.subcategoryName) {
        subcategoryName = specs.subcategoryName
        subcategorySlug = specs.subcategorySlug || ""
      } else if (specs.subcategoryId) {
        // Resolve by ID using pre-fetched subcategories
        if (subcategoryMap.has(specs.subcategoryId)) {
          const scInfo = subcategoryMap.get(specs.subcategoryId)
          subcategoryName = scInfo.name
          subcategorySlug = scInfo.slug
        } else {
          subcategoryName = `Subcategory ${specs.subcategoryId}`
          subcategorySlug = `subcategory-${specs.subcategoryId}`
        }
      }

      return {
        ...product,
        // IDs for forms and relations
        categoryId: product.category_id,
        subcategoryId: specs.subcategoryId || null,
        supplierId: specs.supplierId || null,
        // Names for display
        category: categoryName,
        categorySlug: categorySlug,
        subcategory: subcategoryName,
        subcategorySlug: subcategorySlug,
        supplier: supplierMap.get(specs.supplierId) || "",
        supplierCode: specs.supplierId || "",
        // Other mappings
        thumbnailUrl: product.image_url || "",
        status: specs.status || (product.in_stock ? "active" : "inactive"),
        updatedAt: product.updated_at,
        sku: product.sku || specs.sku || `Product-${product.id}`,
        // Structured data for forms and detailed views
        technicalSpecifications: techSpecs,
        colorVariants: colorVariants,
        colors: (colorVariants || []).map((c: any) => c.name),
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
        // Additional structured fields
        productSpecifications: specs.productSpecifications || {},
        interiorApplications: specs.interiorApplications || [],
        installationNotes: specs.installationNotes || "",
      }
    })

    console.log("[v0] Mapped products for frontend:", mappedProducts.length)

    return NextResponse.json({ items: mappedProducts, total: total })
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
      status: body.status || 'inactive',
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
        category_id,
        image_url,
        price,
        in_stock,
        slug,
        sku, // Добавляем SKU в отдельную колонку
        specifications,
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
