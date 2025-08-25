/*
  Post-import verification script
  - Verifies reference endpoint
  - Fetches all products and validates key fields
*/

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
  const results = { errors: [], warnings: [] }

  function log(...args) { console.log('[verify-import]', ...args) }

  async function getJson(path) {
    const res = await fetch(`${baseUrl}${path}`)
    if (!res.ok) throw new Error(`GET ${path} -> HTTP ${res.status}`)
    return res.json()
  }

  try {
    log('Checking reference data...')
    const ref = await getJson('/api/products/import/reference')
    const cats = Array.isArray(ref.categories) ? ref.categories.length : 0
    const sups = Array.isArray(ref.suppliers) ? ref.suppliers.length : 0
    log(`Reference OK: categories=${cats}, suppliers=${sups}`)
    if (cats === 0) results.errors.push('No categories in reference data')
    if (sups === 0) results.warnings.push('No suppliers in reference data')

    log('Fetching products...')
    const list = await getJson('/api/products?limit=10000&includeInactive=true')
    const items = Array.isArray(list.items) ? list.items : []
    const total = Number(list.total || items.length)
    log(`Products fetched: total=${total}`)

    // Basic validations
    let missingSlug = 0
    let missingSku = 0
    let missingCategory = 0
    let withSpecs = 0
    let withSupplier = 0
    const sampleMissing = []

    for (const p of items) {
      if (!p.slug || typeof p.slug !== 'string' || p.slug.trim() === '') {
        missingSlug++
        if (sampleMissing.length < 5) sampleMissing.push({ id: p.id, name: p.name, sku: p.sku, slug: p.slug })
      }
      if (!p.sku || typeof p.sku !== 'string' || p.sku.trim() === '') missingSku++
      if (!p.categoryId && !p.category_id) missingCategory++
      if (Array.isArray(p.technicalSpecifications) && p.technicalSpecifications.length > 0) withSpecs++
      if (p.supplierId) withSupplier++
    }

    log('Validation summary:')
    log(`- missing slug: ${missingSlug}`)
    log(`- missing sku: ${missingSku}`)
    log(`- missing category: ${missingCategory}`)
    log(`- with specs: ${withSpecs}`)
    log(`- with supplierId: ${withSupplier}`)

    if (missingSlug > 0) results.errors.push(`Products without slug: ${missingSlug}`)
    if (missingSku > 0) results.errors.push(`Products without sku: ${missingSku}`)
    if (missingCategory > 0) results.warnings.push(`Products without category: ${missingCategory}`)

    if (sampleMissing.length > 0) {
      log('Sample products missing slug:')
      for (const s of sampleMissing) log(`  - id=${s.id} name="${s.name}" sku=${s.sku} slug=${s.slug}`)
    }

    // Exit status
    if (results.errors.length) {
      console.error('❌ Verification failed:')
      results.errors.forEach(e => console.error(' -', e))
      if (results.warnings.length) {
        console.warn('⚠ Warnings:')
        results.warnings.forEach(w => console.warn(' -', w))
      }
      process.exitCode = 1
      return
    }

    console.log('✅ Verification passed.')
    if (results.warnings.length) {
      console.warn('⚠ Warnings:')
      results.warnings.forEach(w => console.warn(' -', w))
    }
  } catch (err) {
    console.error('❌ Verification error:', err)
    process.exitCode = 1
  }
}

main()



