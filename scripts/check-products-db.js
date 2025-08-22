import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkProducts() {
  try {
    console.log("[v0] Checking products in database...")

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, slug, created_at")
      .order("id", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching products:", error)
      return
    }

    console.log(`[v0] Found ${products?.length || 0} products in database:`)

    if (products && products.length > 0) {
      products.forEach((product) => {
        console.log(`[v0] Product ID: ${product.id}, Name: "${product.name}", Slug: "${product.slug}"`)
      })

      const product36 = products.find((p) => p.id === 36)
      if (product36) {
        console.log(`[v0] ✅ Product ID 36 EXISTS: "${product36.name}"`)

        // Get detailed info for product 36
        const { data: detailedProduct, error: detailError } = await supabase
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
          .eq("id", 36)
          .single()

        if (detailError) {
          console.error("[v0] Error fetching detailed product 36:", detailError)
        } else {
          console.log("[v0] Product 36 details:", {
            id: detailedProduct.id,
            name: detailedProduct.name,
            category: detailedProduct.categories?.name,
            specifications: !!detailedProduct.specifications,
          })
        }
      } else {
        console.log("[v0] ❌ Product ID 36 NOT FOUND in database")
        console.log("[v0] Available product IDs:", products.map((p) => p.id).join(", "))
      }
    } else {
      console.log("[v0] No products found in database")
    }
  } catch (error) {
    console.error("[v0] Script error:", error)
  }
}

checkProducts()
