import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api/guard'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

function toSlug(s: string) {
  return (s || '')
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function generateUniqueSlug(baseSlug: string, supabase: any): Promise<string> {
  let slug = baseSlug
  let counter = 1
  while (true) {
    const { data: existingProduct } = await supabase.from('products').select('id').eq('slug', slug).single()
    if (!existingProduct) return slug
    slug = `${baseSlug}-${counter}`
    counter++
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permissions
    const authResult = requireRole(request, 'admin')
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.message }, { status: authResult.status })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Excel file is required' }, { status: 400 })
    }

    // Read Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (rawData.length < 2) {
      return NextResponse.json({ error: 'Excel file must contain at least header and one data row' }, { status: 400 })
    }

    // Parse headers and data
    const headers = rawData[0] as string[]
    const rows = rawData.slice(1) as any[][]

    // Validate headers
    const requiredHeaders = [
      'SKU *', 'Product Name *', 'Description *', 'Category Name *', 
      'Subcategory Name *', 'Supplier Code *', 'Size *', 'Thickness *', 'Color Name *'
    ]

    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required headers: ${missingHeaders.join(', ')}` 
      }, { status: 400 })
    }

    // Get reference data for validation
    const referenceResponse = await fetch(`${request.nextUrl.origin}/api/products/import/reference`)
    const referenceData = await referenceResponse.json()

    const supabase = createClient()
    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
      groupedProducts: new Map()
    }

    // Process each row
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex]
      const rowNumber = rowIndex + 2 // +2 because we start from row 2 (after header)

      try {
        // Create object from row data
        const rowData: any = {}
        headers.forEach((header, index) => {
          rowData[header] = row[index] || ''
        })

        // Validate required fields
        const sku = rowData['SKU *']?.toString().trim()
        const productName = rowData['Product Name *']?.toString().trim()
        const description = rowData['Description *']?.toString().trim()
        const categoryName = rowData['Category Name *']?.toString().trim()
        const subcategoryName = rowData['Subcategory Name *']?.toString().trim()
        const supplierCode = rowData['Supplier Code *']?.toString().trim()
        const size = rowData['Size *']?.toString().trim()
        const thickness = rowData['Thickness *']?.toString().trim()
        const colorName = rowData['Color Name *']?.toString().trim()

        // Validate required fields
        const missingFields = []
        if (!sku) missingFields.push('SKU')
        if (!productName) missingFields.push('Product Name')
        if (!description) missingFields.push('Description')
        if (!categoryName) missingFields.push('Category Name')
        if (!subcategoryName) missingFields.push('Subcategory Name')
        if (!supplierCode) missingFields.push('Supplier Code')
        if (!size) missingFields.push('Size')
        if (!thickness) missingFields.push('Thickness')
        if (!colorName) missingFields.push('Color Name')
        
        if (missingFields.length > 0) {
          results.errors.push(`Row ${rowNumber}: Missing required fields: ${missingFields.join(', ')}`)
          continue
        }

        // Validate category exists (unified schema)
        const category = referenceData.categories.find((cat: any) => cat.name === categoryName)
        if (!category) {
          const availableCategories = referenceData.categories.map((c: any) => c.name).join(', ')
          results.errors.push(`Row ${rowNumber}: Category "${categoryName}" not found. Available categories: ${availableCategories}`)
          continue
        }

        // Validate subcategory exists (unified schema)
        const subcategory = category.subcategories.find((sub: any) => sub.name === subcategoryName)
        if (!subcategory) {
          const availableSubcategories = category.subcategories.map((s: any) => s.name).join(', ')
          results.errors.push(`Row ${rowNumber}: Subcategory "${subcategoryName}" not found in category "${categoryName}". Available subcategories: ${availableSubcategories}`)
          continue
        }

        // Validate supplier exists
        const supplier = referenceData.suppliers.find((sup: any) => sup.code === supplierCode)
        if (!supplier) {
          const availableSuppliers = referenceData.suppliers.map((s: any) => `${s.code} (${s.name})`).join(', ')
          results.errors.push(`Row ${rowNumber}: Supplier code "${supplierCode}" not found. Available suppliers: ${availableSuppliers}`)
          continue
        }

                 // Group by SKU
         if (!results.groupedProducts.has(sku)) {
           results.groupedProducts.set(sku, {
             sku,
             name: productName,
             description,
             category_id: category.id, // Use category ID
             subcategory_id: subcategory.id, // Use subcategory ID
             supplierId: supplier.id,
             image_url: rowData['Color Image URL'] || '/placeholder.svg',
             status: 'inactive', // Default to inactive
             technicalSpecifications: [],
             colorVariants: [],
             otherPhotos: [],
             productSpecifications: {
               material: [],
               usage: [],
               application: [],
               physicalProperties: [],
               adhesion: []
             },
             interiorApplications: []
           })
         }

        const product = results.groupedProducts.get(sku)

        // Add technical specification
        const techSpec = {
          size,
          thicknesses: [{
            thickness,
            pcsPerBox: parseInt(rowData['Pcs/Box']) || 0,
            boxSize: rowData['Box Size (cm)'] || '',
            boxVolume: parseFloat(rowData['Box Volume (m³)']) || 0,
            boxWeight: parseFloat(rowData['Box Weight (kg)']) || 0,
            priceModifier: 0
          }]
        }

        // Check if size already exists
        const existingSizeIndex = product.technicalSpecifications.findIndex((spec: any) => spec.size === size)
        if (existingSizeIndex >= 0) {
          // Add thickness to existing size
          product.technicalSpecifications[existingSizeIndex].thicknesses.push(techSpec.thicknesses[0])
        } else {
          // Add new size
          product.technicalSpecifications.push(techSpec)
        }

        // Add color variant
        const colorVariant = {
          name: colorName,
          colorCode: colorName.toUpperCase().replace(/\s+/g, '_'),
          image: rowData['Color Image URL'] || '/placeholder.svg',
          priceModifier: 0
        }

        // Check if color already exists
        const existingColorIndex = product.colorVariants.findIndex((color: any) => color.name === colorName)
        if (existingColorIndex < 0) {
          product.colorVariants.push(colorVariant)
        }

        // Add additional photos
        if (rowData['Additional Photo 1']) {
          product.otherPhotos.push(rowData['Additional Photo 1'])
        }
        if (rowData['Additional Photo 2']) {
          product.otherPhotos.push(rowData['Additional Photo 2'])
        }

        // Add product specifications
        if (rowData['Material Description']) {
          product.productSpecifications.material.push({
            description: rowData['Material Description'],
            icon: ''
          })
        }
        if (rowData['Usage Description']) {
          product.productSpecifications.usage.push({
            description: rowData['Usage Description'],
            icon: ''
          })
        }
        if (rowData['Application Description']) {
          product.productSpecifications.application.push({
            description: rowData['Application Description'],
            icon: ''
          })
        }
        if (rowData['Physical Property']) {
          product.productSpecifications.physicalProperties.push({
            description: rowData['Physical Property'],
            icon: ''
          })
        }
        if (rowData['Adhesion Description']) {
          product.productSpecifications.adhesion.push({
            description: rowData['Adhesion Description'],
            icon: ''
          })
        }

        // Add interior applications
        if (rowData['Interior App Name']) {
          product.interiorApplications.push({
            name: rowData['Interior App Name'],
            description: rowData['Interior App Description'] || '',
            image: rowData['Interior App Image'] || ''
          })
        }

      } catch (error) {
        results.errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Save grouped products to database
    for (const [sku, productData] of results.groupedProducts) {
      try {
        // Check if product exists
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('sku', sku)
          .single()

        // Find supplier info for this product
        const supplier = referenceData.suppliers.find((sup: any) => sup.id === productData.supplierId)
        
        // Prepare DB payload
        const baseSlug = toSlug(productData.name) || toSlug(productData.sku) || `product-${productData.sku || Date.now()}`
        const slug = await generateUniqueSlug(baseSlug, supabase)

        const dbProduct = {
          name: productData.name,
          description: productData.description,
          category_id: productData.category_id,
          image_url: productData.image_url,
          price: 0, // Default price
          in_stock: true, // Default in stock
          sku: productData.sku, // SKU в отдельной колонке
          slug,
          specifications: {
            supplierId: productData.supplierId,
            subcategoryId: productData.subcategory_id, // Store subcategory ID
            status: productData.status || 'inactive',
            colorVariants: productData.colorVariants,
            technicalSpecifications: productData.technicalSpecifications,
            otherPhotos: productData.otherPhotos,
            productSpecifications: productData.productSpecifications,
            interiorApplications: productData.interiorApplications
          }
        }

        if (existingProduct) {
          // Update existing product
          const { error } = await supabase
            .from('products')
            .update(dbProduct)
            .eq('id', existingProduct.id)
          
          if (error) {
            results.errors.push(`Failed to update ${sku}: ${error.message}`)
          } else {
            results.updated++
          }
        } else {
          // Create new product
          const { error } = await supabase
            .from('products')
            .insert(dbProduct)
          
          if (error) {
            results.errors.push(`Failed to create ${sku}: ${error.message}`)
          } else {
            results.created++
          }
        }
      } catch (error) {
        results.errors.push(`Error saving ${sku}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        created: results.created,
        updated: results.updated,
        errors: results.errors,
        total: results.groupedProducts.size
      }
    })
  } catch (error) {
    console.error('Error in products import:', error)
    return NextResponse.json({ error: 'Failed to import products' }, { status: 500 })
  }
}

