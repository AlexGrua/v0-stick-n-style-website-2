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

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] GET request received for product ID:", params.id)
    console.log("[v0] Supabase URL configured:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("[v0] Service role key configured:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    if (params.id === "stats") {
      console.log("[v0] Redirecting stats request to stats endpoint")
      try {
        const { data: products, error } = await supabase.from("products").select("id, in_stock")

        if (error) {
          console.error("[v0] Error fetching products for stats:", error)
          return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
        }

        const stats = {
          totalProducts: products?.length || 0,
          inStock: products?.filter((p) => p.in_stock).length || 0,
          outOfStock: products?.filter((p) => !p.in_stock).length || 0,
        }

        console.log("[v0] Stats calculated:", stats)
        return NextResponse.json(stats)
      } catch (error) {
        console.error("[v0] Error calculating stats:", error)
        return NextResponse.json({ error: "Failed to calculate stats" }, { status: 500 })
      }
    }

    const productId = Number.parseInt(params.id)
    if (isNaN(productId)) {
      console.log("[v0] Invalid product ID format:", params.id)
      return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 })
    }

    console.log("[v0] Fetching product with ID:", productId)

    const { data: product, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          subs
        )
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

    let subcategoryName = ""
    const subId = product.specifications?.sub || product.sub
    if (subId && product.categories?.subs) {
      const subcategory = product.categories.subs.find((sub: any) => sub.id === subId)
      subcategoryName = subcategory?.name || ""
      console.log("[v0] Subcategory mapping:", { subId, subcategoryName })
    }

    let supplierName = ""
    let supplierId = null
    if (product.specifications?.supplierId) {
      supplierId = product.specifications.supplierId
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("shortName, companyName")
        .eq("id", supplierId)
        .single()

      if (supplier) {
        supplierName = supplier.shortName || supplier.companyName || ""
      }
    }

    // Маппинг данных для frontend
    const specs = product.specifications || {}
    const techSpecs = specs.technicalSpecifications || []
    const sizesFromTechSpecs = techSpecs.map((spec: any) => spec.size).filter(Boolean)
    const thicknessFromTechSpecs = techSpecs.map((spec: any) => spec.thickness).filter(Boolean)

    const mappedProduct = {
      ...product,
      thumbnailUrl: product.image_url || "",
      sub: subcategoryName, // Используем название вместо UUID
      subcategoryName: subcategoryName, // Добавляем отдельное поле для subcategory
      supplierName, // Добавляем название поставщика
      supplierId, // Добавляю supplierId для формы
      sizes: sizesFromTechSpecs.length > 0 ? sizesFromTechSpecs : specs.sizes || [],
      thickness: thicknessFromTechSpecs.length > 0 ? thicknessFromTechSpecs : specs.thickness || [],
      pcsPerBox: specs.pcsPerBox || 0,
      boxKg: specs.boxKg || 0,
      boxM3: specs.boxM3 || 0,
      technicalDescription: specs.technicalDescription || "",
      minOrderBoxes: specs.minOrderBoxes || 1,
      category: product.categories?.name || "",
      categorySlug: product.categories?.slug || "",
      technicalSpecifications: techSpecs,
      // Новые поля для детальной страницы
      colorVariants: specs.colorVariants || [],
      interiorApplications: specs.interiorApplications || [],
      installationNotes: specs.installationNotes || "",
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
        productId: params.id,
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = requireRole(req, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const body = await req.json().catch(() => ({}))

    console.log("[v0] Updating product with ID:", params.id)
    console.log("[v0] Update payload:", body)

    const productId = Number.parseInt(params.id)
    if (isNaN(productId)) {
      console.log("[v0] Invalid product ID format:", params.id)
      return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Basic fields
    if (body.name) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.price !== undefined) updateData.price = body.price
    if (body.category_id) updateData.category_id = Number.parseInt(body.category_id)
    if (body.image_url) updateData.image_url = body.image_url
    if (body.in_stock !== undefined) updateData.in_stock = body.in_stock

    // Generate slug from name if not provided
    if (body.name && !body.slug) {
      updateData.slug = toSlug(body.name)
    }

    if (body.specifications) {
      // Get current specifications to merge with updates
      const { data: currentProduct } = await supabase
        .from("products")
        .select("specifications")
        .eq("id", productId)
        .single()

      const currentSpecs = currentProduct?.specifications || {}

      // Merge current specs with new specs
      updateData.specifications = {
        ...currentSpecs,
        ...body.specifications,
        // Ensure SKU is stored in specifications
        sku: body.sku || body.specifications.sku || currentSpecs.sku,
        // Ensure subcategory_id is stored correctly
        subcategory_id: body.subcategory_id || body.specifications.subcategory_id || currentSpecs.subcategory_id,
      }

      console.log("[v0] Updated specifications:", updateData.specifications)
    }

    // Validate category exists
    if (updateData.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", updateData.category_id)
        .single()

      if (categoryError || !category) {
        console.error(`Category not found: ${updateData.category_id}`)
        return NextResponse.json({ error: `Category not found: ${updateData.category_id}` }, { status: 400 })
      }
    }

    console.log("[v0] Final update data:", updateData)

    const { data: product, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating product:", error)
      return NextResponse.json({ error: "Failed to update product", details: error.message }, { status: 500 })
    }

    console.log("[v0] Product updated successfully:", product.id)
    return NextResponse.json(product)
  } catch (error) {
    console.error("[v0] Error in product PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = requireRole(req, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const { error } = await supabase.from("products").delete().eq("id", params.id)

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
