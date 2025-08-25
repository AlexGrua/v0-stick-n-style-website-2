async function testContactSlots() {
  console.log('🧪 Testing Contact slots (top/left/right)...')
  
  try {
    // Test API to check slots
    const response = await fetch('http://localhost:3000/api/pages/contact/blocks')
    
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      console.log(`❌ API error: ${response.status} ${response.statusText}`)
      return
    }
    
    const data = await response.json()
    console.log('✅ API response received')
    console.log('📊 Blocks count:', data.blocks?.length || 0)
    
    // Check slots
    const blocks = data.blocks || []
    const slotChecks = [
      { name: 'contactsHero in top slot', type: 'contactsHero', expectedSlot: 'top' },
      { name: 'contactFormBlock in left slot', type: 'contactFormBlock', expectedSlot: 'left' },
      { name: 'contactChannels in right slot', type: 'contactChannels', expectedSlot: 'right' }
    ]
    
    slotChecks.forEach(check => {
      const block = blocks.find(b => b.type === check.type)
      if (block) {
        if (block.slot === check.expectedSlot) {
          console.log(`✅ ${check.name}: ${block.slot}`)
        } else {
          console.log(`❌ ${check.name}: expected ${check.expectedSlot}, got ${block.slot}`)
        }
      } else {
        console.log(`❌ ${check.name}: block not found`)
      }
    })
    
    // Check for automatic two-column layout
    const hasLeftRight = blocks.some(b => b.slot === 'left' || b.slot === 'right')
    console.log(`📊 Has left/right slots: ${hasLeftRight}`)
    
    // Test public page
    const pageResponse = await fetch('http://localhost:3000/contact')
    if (pageResponse.ok) {
      const html = await pageResponse.text()
      
      // Check for two-column layout elements
      const layoutChecks = [
        { name: 'Two-column grid', pattern: 'lg:grid-cols-12' },
        { name: 'Left column', pattern: 'lg:col-span-7' },
        { name: 'Right column', pattern: 'lg:col-span-5' },
        { name: 'Sticky aside', pattern: 'lg:sticky' }
      ]
      
      layoutChecks.forEach(check => {
        const regex = new RegExp(check.pattern, 'i')
        if (regex.test(html)) {
          console.log(`✅ ${check.name} found`)
        } else {
          console.log(`❌ ${check.name} NOT found`)
        }
      })
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testContactSlots()

