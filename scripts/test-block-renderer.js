async function testBlockRenderer() {
  console.log('🧪 Testing BlockRenderer directly...')
  
  try {
    // Тестируем API блоков
    const response = await fetch('http://localhost:3000/api/pages/contact/blocks')
    const data = await response.json()
    
    console.log('✅ API response:', data)
    
    if (data.blocks && data.blocks.length > 0) {
      console.log('📦 Found blocks:', data.blocks.length)
      
      // Проверяем каждый блок
      data.blocks.forEach((block, index) => {
        console.log(`  ${index + 1}. Type: ${block.type}, ID: ${block.id}`)
        console.log(`     Props:`, JSON.stringify(block.props, null, 2))
      })
      
      // Проверяем, что блоки имеют правильные типы
      const validTypes = ['contactsHero', 'contactFormBlock', 'contactChannels']
      const invalidBlocks = data.blocks.filter(block => !validTypes.includes(block.type))
      
      if (invalidBlocks.length > 0) {
        console.log('⚠️ Invalid block types found:', invalidBlocks.map(b => b.type))
      } else {
        console.log('✅ All blocks have valid types')
      }
      
    } else {
      console.log('❌ No blocks found')
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testBlockRenderer()
