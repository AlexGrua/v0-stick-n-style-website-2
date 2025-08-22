import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("[v0] Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProducts() {
  try {
    console.log("[v0] Checking existing products in database...")

    // Get all products
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, sku, created_at")
      .order("id", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching products:", error)
      return
    }

    console.log(`[v0] Found ${products?.length || 0} products in database:`)

    if (products && products.length > 0) {
      products.forEach((product) => {
        console.log(
          `[v0] Product ID: ${product.id}, Name: "${product.name}", SKU: "${product.sku || "N/A"}", Created: ${product.created_at}`,
        )
      })

      // Check if product 36 exists
      const product36 = products.find((p) => p.id === 36)
      if (product36) {
        console.log(`[v0] ✅ Product 36 EXISTS: "${product36.name}"`)
      } else {
        console.log("[v0] ❌ Product 36 does NOT exist in database")
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
