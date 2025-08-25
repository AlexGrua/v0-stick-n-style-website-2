async function testContactAdminAPI() {
  console.log('🧪 Testing Contact admin API...')
  
  try {
    // Test admin page blocks API
    const response = await fetch('http://localhost:3000/api/pages/contact/blocks?draft=1')
    
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      console.log(`❌ API error: ${response.status} ${response.statusText}`)
      return
    }
    
    const data = await response.json()
    console.log('✅ API response received')
    console.log('📄 Blocks count:', data.blocks?.length || 0)
    
    // Check each block's is_active status
    data.blocks?.forEach((block, index) => {
      console.log(`  ${index + 1}. ${block.type} (ID: ${block.id})`)
      console.log(`     is_active: ${block.is_active} (type: ${typeof block.is_active})`)
      console.log(`     position: ${block.position}`)
    })
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testContactAdminAPI()

