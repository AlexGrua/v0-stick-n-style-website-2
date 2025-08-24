import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api/guard'
import { createClient } from '@/lib/supabase/server'
import { generateCSVFromProducts } from '@/lib/excel-utils'
import type { Product } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    // Check permissions
    const authResult = requireRole(request, 'admin')
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.message }, { status: authResult.status })
    }

    const supabase = createClient()
    
    // Fetch all products with categories
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          subs
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products for export:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Map products to our format
    const mappedProducts: Product[] = (products || []).map((product: any) => {
      const specs = product.specifications || {}
      const techSpecs = specs.technicalSpecifications || []
      const colorVariants = specs.colorVariants || []

      // Extract sizes and thicknesses
      const allSizes = techSpecs.map((spec: any) => spec.size).filter(Boolean)
      const allThickness = techSpecs
        .flatMap((spec: any) => spec.thicknesses?.map((t: any) => t.thickness) || [])
        .filter(Boolean)

      // Calculate average values
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
        id: product.id,
        sku: specs.sku || `Product-${product.id}`,
        name: product.name,
        description: product.description,
        category: product.categories?.name || '',
        sub: specs.sub || '',
        technicalSpecifications: techSpecs,
        colorVariants: colorVariants,
        pcsPerBox: avgPcsPerBox || specs.pcsPerBox || 0,
        boxKg: avgBoxKg || specs.boxKg || 0,
        boxM3: avgBoxM3 || specs.boxM3 || 0,
        minOrderBoxes: specs.minOrderBoxes || 1,
        status: product.in_stock ? 'active' : 'inactive',
        tags: [],
        thumbnailUrl: product.image_url || '',
        gallery: [],
        stockLevel: 0,
        version: 1,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        technicalDescription: specs.technicalDescription || '',
        installationNotes: specs.installationNotes || '',
      }
    })

    // Generate CSV content
    const csvContent = generateCSVFromProducts(mappedProducts)
    
    // Create response with CSV headers
    const response = new NextResponse(csvContent)
    response.headers.set('Content-Type', 'text/csv')
    response.headers.set('Content-Disposition', 'attachment; filename="products-export.csv"')
    
    return response
  } catch (error) {
    console.error('Error in products export:', error)
    return NextResponse.json({ error: 'Failed to export products' }, { status: 500 })
  }
}
