const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Загружаем переменные окружения из .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value
      }
    }
  })
}

// Проверяем переменные окружения
console.log('Environment check:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('❌ Missing environment variables. Please check your .env.local file.')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testContactBlocks() {
  console.log('🧪 Testing Contact blocks...')
  
  try {
    // Проверяем таблицу pages
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .eq('key', 'contact')
    
    if (pagesError) {
      console.log('❌ Error checking pages:', pagesError.message)
      return
    }
    
    console.log('✅ Pages table accessible')
    console.log('📄 Contact page exists:', pages && pages.length > 0)
    
    if (pages && pages.length > 0) {
      const page = pages[0]
      console.log('📋 Page ID:', page.id)
      
      // Проверяем блоки
      const { data: blocks, error: blocksError } = await supabase
        .from('page_blocks')
        .select('*')
        .eq('page_id', page.id)
        .order('position')
      
      if (blocksError) {
        console.log('❌ Error checking blocks:', blocksError.message)
        return
      }
      
      console.log('✅ Page blocks accessible')
      console.log('📦 Found blocks:', blocks?.length || 0)
      
      if (blocks) {
        blocks.forEach((block, index) => {
          console.log(`  ${index + 1}. ${block.type} (position: ${block.position}, active: ${block.is_active})`)
        })
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testContactBlocks()
