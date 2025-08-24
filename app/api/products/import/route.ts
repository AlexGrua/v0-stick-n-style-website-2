import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api/guard'
import { createClient } from '@/lib/supabase/server'
import { parseCSVToProducts } from '@/lib/excel-utils'

export async function POST(request: NextRequest) {
  try {
    // Check permissions
    const authResult = requireRole(request, 'admin')
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.message }, { status: authResult.status })
    }

    const body = await request.json()
    const { csvContent } = body

    if (!csvContent) {
      return NextResponse.json({ error: 'CSV content is required' }, { status: 400 })
    }

    // Parse CSV to products
    const products = parseCSVToProducts(csvContent)
    
    if (products.length === 0) {
      return NextResponse.json({ error: 'No valid products found in CSV' }, { status: 400 })
    }

    const supabase = createClient()
    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[]
    }

    // Process each product
    for (const productData of products) {
      try {
        if (!productData.sku || !productData.name) {
          results.errors.push(`Product missing SKU or name: ${productData.sku || 'No SKU'}`)
          continue
        }

        // Check if product exists
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('specifications->>sku', productData.sku)
          .single()

        // Get category ID
        let categoryId = null
        if (productData.category) {
          const { data: category } = await supabase
            .from('categories')
            .select('id')
            .or(`name.eq.${productData.category},slug.eq.${productData.category}`)
            .single()
          categoryId = category?.id
        }

        // Prepare product data for database
        const dbProduct = {
          name: productData.name,
          description: productData.description || '',
          category_id: categoryId,
          image_url: productData.thumbnailUrl || '',
          in_stock: productData.status === 'active',
          specifications: {
            sku: productData.sku,
            sub: productData.sub || '',
            technicalSpecifications: productData.technicalSpecifications || [],
            colorVariants: productData.colorVariants || [],
            pcsPerBox: productData.pcsPerBox || 0,
            boxKg: productData.boxKg || 0,
            boxM3: productData.boxM3 || 0,
            minOrderBoxes: productData.minOrderBoxes || 1,
            technicalDescription: productData.technicalDescription || '',
            installationNotes: productData.installationNotes || '',
          }
        }

        if (existingProduct) {
          // Update existing product
          const { error } = await supabase
            .from('products')
            .update(dbProduct)
            .eq('id', existingProduct.id)
          
          if (error) {
            results.errors.push(`Failed to update ${productData.sku}: ${error.message}`)
          } else {
            results.updated++
          }
        } else {
          // Create new product
          const { error } = await supabase
            .from('products')
            .insert(dbProduct)
          
          if (error) {
            results.errors.push(`Failed to create ${productData.sku}: ${error.message}`)
          } else {
            results.created++
          }
        }
      } catch (error) {
        results.errors.push(`Error processing ${productData.sku}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total: products.length
    })
  } catch (error) {
    console.error('Error in products import:', error)
    return NextResponse.json({ error: 'Failed to import products' }, { status: 500 })
  }
}

