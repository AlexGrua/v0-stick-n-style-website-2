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

async function testGetBlocks() {
  console.log('🧪 Testing getBlocks function...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // 1. Find contact page
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('id')
      .eq('key', 'contact')
      .single()
    
    if (pageError) {
      console.log('❌ Error finding page:', pageError.message)
      return
    }
    
    if (!page) {
      console.log('❌ Contact page not found')
      return
    }
    
    console.log('✅ Contact page found:', page)
    
    // 2. Get blocks (simulating getBlocks function)
    const { data: rows, error: blocksError } = await supabase
      .from('page_blocks')
      .select('id, type, props, slot, position, is_active, locale, valid_from, valid_to')
      .eq('page_id', page.id)
      .eq('is_active', true) // Published blocks only
      .order('position', { ascending: true })
    
    if (blocksError) {
      console.log('❌ Error getting blocks:', blocksError.message)
      return
    }
    
    console.log(`✅ Found ${rows?.length || 0} active blocks:`)
    rows?.forEach((block, index) => {
      console.log(`  ${index + 1}. ${block.type} (ID: ${block.id}, Position: ${block.position})`)
      console.log(`     Props:`, JSON.stringify(block.props, null, 2))
    })
    
    // 3. Test draft mode
    console.log('\n📝 Testing draft mode...')
    const { data: draftRows, error: draftError } = await supabase
      .from('page_blocks')
      .select('id, type, props, slot, position, is_active, locale, valid_from, valid_to')
      .eq('page_id', page.id)
      .order('position', { ascending: true })
    
    if (draftError) {
      console.log('❌ Error getting draft blocks:', draftError.message)
      return
    }
    
    console.log(`✅ Found ${draftRows?.length || 0} draft blocks:`)
    draftRows?.forEach((block, index) => {
      console.log(`  ${index + 1}. ${block.type} (ID: ${block.id}, Active: ${block.is_active}, Position: ${block.position})`)
    })
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testGetBlocks()

