async function testContactBlocksContent() {
  console.log('🧪 Testing Contact blocks content...')
  
  try {
    // Test public page blocks API (published version)
    const response = await fetch('http://localhost:3000/api/pages/contact/blocks')
    
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      console.log(`❌ API error: ${response.status} ${response.statusText}`)
      return
    }
    
    const data = await response.json()
    console.log('✅ API response received')
    console.log('📄 Blocks count:', data.blocks?.length || 0)
    
    // Check each block's content
    data.blocks?.forEach((block, index) => {
      console.log(`\n${index + 1}. ${block.type} (ID: ${block.id})`)
      console.log(`   Position: ${block.position}`)
      console.log(`   Active: ${block.is_active}`)
      console.log(`   Props:`, JSON.stringify(block.props, null, 2))
    })
    
    // Also test draft version for comparison
    console.log('\n--- DRAFT VERSION ---')
    const draftResponse = await fetch('http://localhost:3000/api/pages/contact/blocks?draft=1')
    if (draftResponse.ok) {
      const draftData = await draftResponse.json()
      console.log('📄 Draft blocks count:', draftData.blocks?.length || 0)
      
      draftData.blocks?.forEach((block, index) => {
        console.log(`\n${index + 1}. ${block.type} (ID: ${block.id})`)
        console.log(`   Position: ${block.position}`)
        console.log(`   Active: ${block.is_active}`)
        console.log(`   Props:`, JSON.stringify(block.props, null, 2))
      })
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testContactBlocksContent()

