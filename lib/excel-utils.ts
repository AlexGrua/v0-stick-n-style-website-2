import type { Product, TechnicalSpec, ThicknessSpec, ColorVariant } from '@/lib/types'

// Excel column definitions
export const EXCEL_COLUMNS = {
  SKU: 'SKU',
  NAME: 'Product Name',
  DESCRIPTION: 'Description',
  CATEGORY: 'Category',
  SUBCATEGORY: 'Subcategory',
  SUPPLIER: 'Supplier',
  STATUS: 'Status',
  // Technical specifications
  SIZES: 'Sizes (comma separated)',
  THICKNESSES: 'Thicknesses (comma separated)',
  // Legacy fields for backward compatibility
  PCS_PER_BOX: 'Pieces per Box',
  BOX_KG: 'Box Weight (kg)',
  BOX_M3: 'Box Volume (m³)',
  MIN_ORDER_BOXES: 'Min Order Boxes',
  // Colors
  COLORS: 'Colors (comma separated)',
  // Technical description
  TECHNICAL_DESCRIPTION: 'Technical Description',
  // Installation notes
  INSTALLATION_NOTES: 'Installation Notes',
} as const

// Helper function to flatten product structure for Excel export
export function flattenProductForExport(product: Product): Record<string, any> {
  // Extract all sizes and thicknesses
  const allSizes = product.technicalSpecifications?.map(spec => spec.size).filter(Boolean) || []
  const allThicknesses = product.technicalSpecifications
    ?.flatMap(spec => spec.thicknesses?.map(t => t.thickness) || [])
    .filter(Boolean) || []
  
  // Extract colors
  const allColors = product.colorVariants?.map(color => color.name).filter(Boolean) || []
  
  // Calculate average values from technical specs
  let avgPcsPerBox = 0
  let avgBoxKg = 0
  let avgBoxM3 = 0
  let totalThicknesses = 0

  product.technicalSpecifications?.forEach(spec => {
    spec.thicknesses?.forEach(thickness => {
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
    [EXCEL_COLUMNS.SKU]: product.sku || '',
    [EXCEL_COLUMNS.NAME]: product.name || '',
    [EXCEL_COLUMNS.DESCRIPTION]: product.description || '',
    [EXCEL_COLUMNS.CATEGORY]: product.category || '',
    [EXCEL_COLUMNS.SUBCATEGORY]: product.sub || '',
    [EXCEL_COLUMNS.SUPPLIER]: '', // Will be filled from specifications
    [EXCEL_COLUMNS.STATUS]: product.status || 'inactive',
    [EXCEL_COLUMNS.SIZES]: allSizes.join(', '),
    [EXCEL_COLUMNS.THICKNESSES]: allThicknesses.join(', '),
    [EXCEL_COLUMNS.PCS_PER_BOX]: avgPcsPerBox || product.pcsPerBox || 0,
    [EXCEL_COLUMNS.BOX_KG]: avgBoxKg || product.boxKg || 0,
    [EXCEL_COLUMNS.BOX_M3]: avgBoxM3 || product.boxM3 || 0,
    [EXCEL_COLUMNS.MIN_ORDER_BOXES]: product.minOrderBoxes || 1,
    [EXCEL_COLUMNS.COLORS]: allColors.join(', '),
    [EXCEL_COLUMNS.TECHNICAL_DESCRIPTION]: product.technicalDescription || '',
    [EXCEL_COLUMNS.INSTALLATION_NOTES]: product.installationNotes || '',
  }
}

// Helper function to parse Excel row into product structure
export function parseExcelRowToProduct(row: Record<string, any>): Partial<Product> {
  const sizes = (row[EXCEL_COLUMNS.SIZES] || '').split(',').map((s: string) => s.trim()).filter(Boolean)
  const thicknesses = (row[EXCEL_COLUMNS.THICKNESSES] || '').split(',').map((s: string) => s.trim()).filter(Boolean)
  const colors = (row[EXCEL_COLUMNS.COLORS] || '').split(',').map((s: string) => s.trim()).filter(Boolean)

  // Create technical specifications from sizes and thicknesses
  const technicalSpecifications: TechnicalSpec[] = []
  
  if (sizes.length > 0 && thicknesses.length > 0) {
    // Simple approach: assign all thicknesses to all sizes
    sizes.forEach(size => {
      const thicknessSpecs: ThicknessSpec[] = thicknesses.map(thickness => ({
        thickness,
        pcsPerBox: Number(row[EXCEL_COLUMNS.PCS_PER_BOX]) || 0,
        boxSize: '', // Will need to be filled manually
        boxVolume: Number(row[EXCEL_COLUMNS.BOX_M3]) || 0,
        boxWeight: Number(row[EXCEL_COLUMNS.BOX_KG]) || 0,
      }))
      
      technicalSpecifications.push({
        size,
        thicknesses: thicknessSpecs,
      })
    })
  }

  // Create color variants
  const colorVariants: ColorVariant[] = colors.map(color => ({
    name: color,
    colorCode: color.toUpperCase().replace(/\s+/g, ''),
    image: '', // Will need to be filled manually
    priceModifier: 0,
  }))

  return {
    sku: row[EXCEL_COLUMNS.SKU] || '',
    name: row[EXCEL_COLUMNS.NAME] || '',
    description: row[EXCEL_COLUMNS.DESCRIPTION] || '',
    category: row[EXCEL_COLUMNS.CATEGORY] || '',
    sub: row[EXCEL_COLUMNS.SUBCATEGORY] || '',
    status: (row[EXCEL_COLUMNS.STATUS] as any) || 'inactive',
    technicalSpecifications,
    colorVariants,
    // Legacy fields for backward compatibility
    pcsPerBox: Number(row[EXCEL_COLUMNS.PCS_PER_BOX]) || 0,
    boxKg: Number(row[EXCEL_COLUMNS.BOX_KG]) || 0,
    boxM3: Number(row[EXCEL_COLUMNS.BOX_M3]) || 0,
    minOrderBoxes: Number(row[EXCEL_COLUMNS.MIN_ORDER_BOXES]) || 1,
    technicalDescription: row[EXCEL_COLUMNS.TECHNICAL_DESCRIPTION] || '',
    installationNotes: row[EXCEL_COLUMNS.INSTALLATION_NOTES] || '',
  }
}

// Generate CSV content from products
export function generateCSVFromProducts(products: Product[]): string {
  if (products.length === 0) return ''

  const headers = Object.values(EXCEL_COLUMNS)
  const rows = products.map(product => {
    const flat = flattenProductForExport(product)
    return headers.map(header => {
      const value = flat[header] || ''
      // Escape CSV values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
  })

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// Parse CSV content to products
export function parseCSVToProducts(csvContent: string): Partial<Product>[] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim())
  const products: Partial<Product>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row: Record<string, any> = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    products.push(parseExcelRowToProduct(row))
  }

  return products
}
