async function testContactAPI() {
  console.log('🧪 Testing Contact API...')
  
  // Debug environment
  console.log('Environment check:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET')
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET')
  
  try {
    // Test API endpoint
    const response = await fetch('http://localhost:3001/api/pages/contact/blocks?draft=1')
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ API error: ${response.status} ${response.statusText}`)
      console.log('Error body:', errorText)
      return
    }
    
    const data = await response.json()
    console.log('✅ API response:', JSON.stringify(data, null, 2))
    
    if (data.blocks && data.blocks.length > 0) {
      console.log(`✅ Found ${data.blocks.length} blocks`)
      data.blocks.forEach((block, index) => {
        console.log(`  ${index + 1}. ${block.type} (ID: ${block.id}, Active: ${block.is_active})`)
      })
    } else {
      console.log('⚠️ No blocks found')
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testContactAPI()
