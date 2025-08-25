const { createClient } = require('@supabase/supabase-js')

async function testContactSaveResult() {
  console.log('🧪 Testing Contact save result...')
  
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
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // 1. Find contact page
    const { data: page } = await supabase
      .from('pages')
      .select('id, key')
      .eq('key', 'contact')
      .single()
    
    if (!page) {
      console.log('❌ Contact page not found')
      return
    }
    
    console.log('✅ Contact page found:', page)
    
    // 2. Get all blocks for contact page
    const { data: blocks } = await supabase
      .from('page_blocks')
      .select('*')
      .eq('page_id', page.id)
      .order('position')
    
    console.log(`✅ Found ${blocks?.length || 0} blocks:`)
    blocks?.forEach((block, index) => {
      console.log(`  ${index + 1}. ${block.type} (ID: ${block.id}, Active: ${block.is_active}, Position: ${block.position})`)
      console.log(`     Props:`, JSON.stringify(block.props, null, 2))
    })
    
    // 3. Get latest publication
    const { data: publications } = await supabase
      .from('page_publications')
      .select('*')
      .eq('page_id', page.id)
      .order('published_at', { ascending: false })
      .limit(1)
    
    if (publications?.length > 0) {
      console.log('✅ Latest publication:', publications[0])
    } else {
      console.log('⚠️ No publications found')
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

testContactSaveResult()
