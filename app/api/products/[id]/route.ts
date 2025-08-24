import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/api/guard"

const supabase = createClient()

function toSlug(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[v0] GET request received for product ID:", id)
    console.log("[v0] Supabase URL configured:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("[v0] Service role key configured:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    if (id === "stats") {
      console.log("[v0] Redirecting stats request to stats endpoint")
      try {
        const { data: products, error } = await supabase.from("products").select("id, in_stock")

        if (error) {
          console.error("[v0] Error fetching products for stats:", error)
          return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
        }

        const stats = {
          totalProducts: products?.length || 0,
          inStock: products?.filter((p: any) => p.in_stock).length || 0,
          outOfStock: products?.filter((p: any) => !p.in_stock).length || 0,
        }

        console.log("[v0] Stats calculated:", stats)
        return NextResponse.json(stats)
      } catch (error) {
        console.error("[v0] Error calculating stats:", error)
        return NextResponse.json({ error: "Failed to calculate stats" }, { status: 500 })
      }
    }

    const productId = Number.parseInt(id)
    if (isNaN(productId)) {
      console.log("[v0] Invalid product ID format:", id)
      return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 })
    }

    console.log("[v0] Fetching product with ID:", productId)

    const { data: product, error } = await supabase
      .from("products")
      .select(`
        *,
        categories:category_id(id, name, slug, description)
      `)
      .eq("id", productId)
      .single()

    console.log("[v0] Product query result:", {
      product: !!product,
      error: error?.message || null,
      productId: product?.id,
      productName: product?.name,
    })

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json(
        {
          error: "Database error",
          details: error.message,
          productId: productId,
        },
        { status: 500 },
      )
    }

    if (!product) {
      console.log("[v0] Product not found for ID:", productId)
      return NextResponse.json(
        {
          error: "Product not found",
          productId: productId,
        },
        { status: 404 },
      )
    }

    console.log("[v0] Product found:", { id: product.id, name: product.name })

    // Extract data from JOINs according to actual schema
    const categoryInfo = product.categories || {}
    const subcategoryInfo = {} // Временно отключаем
    const supplierInfo = {} // Получаем из specifications

    // Маппинг данных для frontend
    const specs = product.specifications || {}
    const techSpecs = specs.technicalSpecifications || []
    
    // Extract all sizes and thicknesses for backward compatibility
    const sizesFromTechSpecs = techSpecs.map((spec: any) => spec.size).filter(Boolean)
    const thicknessFromTechSpecs = techSpecs
      .flatMap((spec: any) => spec.thicknesses?.map((t: any) => t.thickness) || [])
      .filter(Boolean)

    // Calculate average values from technical specs
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

    // Get status from specifications or fallback to product.status
    const productStatus = specs.status || product.status || 'inactive'

    const mappedProduct = {
      ...product,
      // IDs for forms and relations (actual schema)
      categoryId: product.category_id,
      subcategoryId: null, // Временно отключаем
      supplierId: specs.supplierId || null,
      // Names for display (from JOINs and specifications)
      category: categoryInfo.name || "",
      categorySlug: categoryInfo.slug || "",
      subcategory: "", // Временно отключаем
      subcategorySlug: "", // Временно отключаем
      supplier: "", // Получаем из specifications
      supplierCode: specs.supplierId || "",
      supplierContact: "", // Получаем из specifications
      supplierEmail: "", // Получаем из specifications
              supplierPhone: "", // Получаем из specifications
      // Core product data
      sku: product.sku || specs.sku || "",
      thumbnailUrl: product.image_url || "",
      status: productStatus,
      // Legacy fields for backward compatibility
      sizes: sizesFromTechSpecs.length > 0 ? sizesFromTechSpecs : specs.sizes || [],
      thickness: thicknessFromTechSpecs.length > 0 ? thicknessFromTechSpecs : specs.thickness || [],
      pcsPerBox: avgPcsPerBox || specs.pcsPerBox || 0,
      boxKg: avgBoxKg || specs.boxKg || 0,
      boxM3: avgBoxM3 || specs.boxM3 || 0,
      technicalDescription: specs.technicalDescription || "",
      minOrderBoxes: specs.minOrderBoxes || 1,
      // Structured data for forms
      technicalSpecifications: techSpecs,
      colorVariants: specs.colorVariants || [],
      // Product specifications
      productSpecifications: specs.productSpecifications || {},
      interiorApplications: specs.interiorApplications || [],
      installationNotes: specs.installationNotes || "",
      // Legacy fields for backward compatibility
      material: specs.material || "",
      usage: specs.usage || "",
      application: specs.application || "",
      adhesion: specs.adhesion || "",
      physicalProperties: specs.physicalProperties || [],
      suitableSurfaces: specs.suitableSurfaces || [],
    }

    console.log("[v0] Returning mapped product:", {
      id: mappedProduct.id,
      name: mappedProduct.name,
      supplierId: mappedProduct.supplierId,
      techSpecsCount: mappedProduct.technicalSpecifications.length,
    })
    return NextResponse.json(mappedProduct)
  } catch (error) {
    console.error("[v0] Error fetching product:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = requireRole(req, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const body = await req.json().catch(() => ({}))

    const { id } = await params
    console.log("[v0] Updating product with ID:", id)
    console.log("[v0] Update payload:", body)

    const productId = Number.parseInt(id)
    if (isNaN(productId)) {
      console.log("[v0] Invalid product ID format:", id)
      return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Basic fields according to unified schema
    if (body.name) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.price !== undefined) updateData.price = body.price
    if (body.sku) updateData.sku = body.sku
    if (body.category_id) updateData.category_id = Number(body.category_id)
    // Временно отключаем subcategory_id и supplier_id - они хранятся в specifications
    // if (body.subcategory_id) updateData.subcategory_id = Number(body.subcategory_id)
    // if (body.supplier_id) updateData.supplier_id = Number(body.supplier_id)
    if (body.image_url) updateData.image_url = body.image_url
    if (body.in_stock !== undefined) updateData.in_stock = body.in_stock
    if (body.is_featured !== undefined) updateData.is_featured = body.is_featured

    // Generate slug from name if not provided
    if (body.name && !body.slug) {
      const baseSlug = toSlug(body.name)
      updateData.slug = baseSlug
    }

    // Handle status update (can come from body.status or body.specifications.status)
    const statusToUpdate = body.status || body.specifications?.status

    // Get current specifications to merge with updates
    const { data: currentProduct } = await supabase
      .from("products")
      .select("specifications")
      .eq("id", productId)
      .single()

    const currentSpecs = currentProduct?.specifications || {}

    // Prepare specifications update
    const specsUpdate = {
      ...currentSpecs,
      ...body.specifications,
      // Ensure SKU is stored in specifications for backward compatibility
      sku: body.sku || body.specifications?.sku || currentSpecs.sku,
    }

    // Update status in specifications if provided
    if (statusToUpdate) {
      specsUpdate.status = statusToUpdate
      console.log("[v0] Updating product status to:", statusToUpdate)
    }

    // Always update specifications to ensure status is properly stored
    updateData.specifications = specsUpdate

    console.log("[v0] Updated specifications:", updateData.specifications)

    // Validate category exists (if provided as ID)
    if (body.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", body.category_id)
        .single()

      if (categoryError || !category) {
        console.error(`Category not found: ${body.category_id}`)
        return NextResponse.json({ error: `Category not found: ${body.category_id}` }, { status: 400 })
      }
    }

    // console.log("[v0] Final update data:", updateData)

    const { data: product, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating product:", error)
      
      // Handle specific slug duplicate error
      if (error.code === '23505' && error.message.includes('slug')) {
        return NextResponse.json({ 
          error: "Product with this name already exists. Please choose a different name.",
          details: error.message 
        }, { status: 400 })
      }
      
      return NextResponse.json({ error: "Failed to update product", details: error.message }, { status: 500 })
    }

    console.log("[v0] Product updated successfully:", product.id)
    return NextResponse.json(product)
  } catch (error) {
    console.error("[v0] Error in product PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = requireRole(req, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const { id } = await params
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      console.error("Error deleting product:", error)
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error in product DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
