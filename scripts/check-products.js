import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkProducts() {
  try {
    console.log("🔍 Checking products in database...")

    // Get all products
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, slug, created_at")
      .order("id", { ascending: true })

    if (error) {
      console.error("❌ Error fetching products:", error)
      return
    }

    console.log(`📊 Total products found: ${products?.length || 0}`)

    if (products && products.length > 0) {
      console.log("\n📋 Products list:")
      products.forEach((product) => {
        console.log(`  ID: ${product.id} | Name: ${product.name} | Slug: ${product.slug}`)
      })

      // Check specifically for product ID 36
      const product36 = products.find((p) => p.id === 36)
      if (product36) {
        console.log(`\n✅ Product ID 36 found: ${product36.name}`)

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
          console.error("❌ Error fetching detailed product 36:", detailError)
        } else {
          console.log("📄 Product 36 details:", {
            id: detailedProduct.id,
            name: detailedProduct.name,
            category: detailedProduct.categories?.name,
            specifications: !!detailedProduct.specifications,
            specsKeys: detailedProduct.specifications ? Object.keys(detailedProduct.specifications) : [],
          })
        }
      } else {
        console.log("\n❌ Product ID 36 NOT found in database")
      }
    } else {
      console.log("📭 No products found in database")
    }
  } catch (error) {
    console.error("💥 Script error:", error)
  }
}

checkProducts()
