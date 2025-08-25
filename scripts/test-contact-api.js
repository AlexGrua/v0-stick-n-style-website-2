async function testContactAPI() {
  console.log('🧪 Testing Contact API...')
  
  try {
    // Тестируем API блоков для страницы contact
    const response = await fetch('http://localhost:3000/api/pages/contact/blocks')
    
    if (!response.ok) {
      console.log(`❌ API error: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.log('Error details:', errorText)
      return
    }
    
    const data = await response.json()
    console.log('✅ API response received')
    console.log('📦 Response structure:', Object.keys(data))
    
    if (data.blocks) {
      console.log('📦 Blocks count:', data.blocks.length)
      
      data.blocks.forEach((block, index) => {
        console.log(`  ${index + 1}. ${block.type} (id: ${block.id})`)
        console.log(`     Props:`, JSON.stringify(block.props, null, 2))
      })
    } else {
      console.log('❌ No blocks field in response')
      console.log('Full response:', JSON.stringify(data, null, 2))
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testContactAPI()
