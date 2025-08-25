async function testContactPublicPublished() {
  console.log('🧪 Testing Contact public page (published version)...')
  
  try {
    // Test public page without draft mode (should show published blocks)
    const response = await fetch('http://localhost:3000/contact?newblocks=1')
    
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      console.log(`❌ Public page error: ${response.status} ${response.statusText}`)
      return
    }
    
    const html = await response.text()
    console.log('✅ Contact public page loaded successfully')
    console.log('📄 Page length:', html.length, 'characters')
    
    // Check for block content
    const blockChecks = [
      { name: 'Block renderer div', pattern: 'block-renderer' },
      { name: 'Contact Us title', pattern: 'Contact Us' },
      { name: 'Contact form', pattern: 'contact.*form|form.*contact' },
      { name: 'Contact channels', pattern: 'email|phone|whatsapp|telegram' }
    ]
    
    blockChecks.forEach(check => {
      const regex = new RegExp(check.pattern, 'i')
      if (regex.test(html)) {
        console.log(`✅ ${check.name} found`)
      } else {
        console.log(`⚠️ ${check.name} NOT found`)
      }
    })
    
    // Check for specific content from published blocks
    const contentChecks = [
      { name: 'Updated title', pattern: 'Contact Us sdfsdfsdfываsdgsdg' },
      { name: 'Updated form title', pattern: 'hey!' },
      { name: 'Updated email', pattern: 'hello@sticknstyle.com' }
    ]
    
    contentChecks.forEach(check => {
      const regex = new RegExp(check.pattern, 'i')
      if (regex.test(html)) {
        console.log(`✅ ${check.name} found`)
      } else {
        console.log(`⚠️ ${check.name} NOT found`)
      }
    })
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testContactPublicPublished()

