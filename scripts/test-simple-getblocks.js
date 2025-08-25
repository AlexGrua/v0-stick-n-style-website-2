// Load environment variables from .env.local
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
}

const { createClient } = require('@supabase/supabase-js')

// Simple version of getBlocks without caching
async function getBlocksSimple(pageKey, opts = {}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  if (!supabase.from) return []
  
  const { data: page } = await supabase.from("pages").select("id").eq("key", pageKey).single()
  if (!page) return []
  
  const locale = opts?.locale || null
  let q = supabase
    .from("page_blocks")
    .select("id, type, props, slot, position, is_active, locale, valid_from, valid_to")
    .eq("page_id", page.id)
    .order("position", { ascending: true })

  if (!opts?.draft) q = q.eq("is_active", true)

  const { data: rows } = await q
  const list = rows || []
  
  // Locale fallback: prefer exact match, then NULL
  const filtered = list.filter((b) => !locale || b.locale === locale || b.locale === null)
  
  // Valid window
  const now = new Date().toISOString()
  const inWindow = filtered.filter((b) => (!b.valid_from || b.valid_from <= now) && (!b.valid_to || b.valid_to >= now))
  
  return inWindow.map((b) => ({ 
    id: b.id, 
    type: b.type, 
    props: b.props, 
    slot: b.slot, 
    position: b.position 
  }))
}

async function testSimpleGetBlocks() {
  console.log('🧪 Testing simple getBlocks function...')
  
  try {
    // Test published blocks
    console.log('📄 Testing published blocks...')
    const publishedBlocks = await getBlocksSimple('contact', { draft: false })
    console.log(`✅ Found ${publishedBlocks.length} published blocks:`)
    publishedBlocks.forEach((block, index) => {
      console.log(`  ${index + 1}. ${block.type} (ID: ${block.id}, Position: ${block.position})`)
      console.log(`     Props:`, JSON.stringify(block.props, null, 2))
    })
    
    // Test draft blocks
    console.log('\n📝 Testing draft blocks...')
    const draftBlocks = await getBlocksSimple('contact', { draft: true })
    console.log(`✅ Found ${draftBlocks.length} draft blocks:`)
    draftBlocks.forEach((block, index) => {
      console.log(`  ${index + 1}. ${block.type} (ID: ${block.id}, Position: ${block.position})`)
    })
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testSimpleGetBlocks()

