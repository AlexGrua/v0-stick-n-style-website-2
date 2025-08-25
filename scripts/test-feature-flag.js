async function testFeatureFlag() {
  console.log('🧪 Testing feature flag...')
  
  try {
    // Test public page with feature flag check
    const response = await fetch('http://localhost:3000/contact')
    
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      console.log(`❌ Public page error: ${response.status} ${response.statusText}`)
      return
    }
    
    const html = await response.text()
    console.log('✅ Contact page loaded successfully')
    
    // Check if blocks are being used
    if (html.includes('block-renderer')) {
      console.log('✅ Feature flag is ENABLED - using blocks')
    } else if (html.includes('Contact Information')) {
      console.log('❌ Feature flag is DISABLED - using legacy page')
    } else {
      console.log('⚠️ Unknown state')
    }
    
    // Check for specific content
    if (html.includes('Contact Us sdfsdfsdfываsdgsdg')) {
      console.log('✅ Updated content found')
    } else {
      console.log('❌ Updated content NOT found')
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testFeatureFlag()
