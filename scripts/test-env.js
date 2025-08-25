console.log('🧪 Testing environment variables...')

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

console.log('Environment check:')
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET')
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET')
console.log('- NEXT_PUBLIC_FEATURE_BLOCK_CONTACTS:', process.env.NEXT_PUBLIC_FEATURE_BLOCK_CONTACTS || 'NOT SET')

// Test Supabase connection
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (supabaseUrl && supabaseKey) {
  console.log('✅ Supabase credentials found, testing connection...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Test a simple query
  supabase.from('pages').select('id, key').limit(1).then(({ data, error }) => {
    if (error) {
      console.log('❌ Supabase connection failed:', error.message)
    } else {
      console.log('✅ Supabase connection successful')
      console.log('Sample data:', data)
    }
  }).catch(err => {
    console.log('❌ Supabase test failed:', err.message)
  })
} else {
  console.log('❌ Missing Supabase credentials')
}

