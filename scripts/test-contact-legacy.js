async function testContactLegacy() {
  console.log('🧪 Testing Contact legacy page (without newblocks)...')
  
  try {
    // Test public page without newblocks parameter
    const response = await fetch('http://localhost:3000/contact')
    
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      console.log(`❌ Public page error: ${response.status} ${response.statusText}`)
      return
    }
    
    const html = await response.text()
    console.log('✅ Contact legacy page loaded successfully')
    console.log('📄 Page length:', html.length, 'characters')
    
    // Check for legacy content vs new content
    const checks = [
      { name: 'Legacy Contact Information', pattern: 'Contact Information' },
      { name: 'Legacy Shenzhen', pattern: 'Shenzhen, China' },
      { name: 'Legacy phone', pattern: '\\+86 123 456 789' },
      { name: 'Legacy email', pattern: 'hello@sticknstyle\\.com' },
      { name: 'New block renderer', pattern: 'block-renderer' },
      { name: 'Updated title', pattern: 'Contact Us sdfsdfsdfываsdgsdg' },
      { name: 'Updated form title', pattern: 'hey!' }
    ]
    
    checks.forEach(check => {
      const regex = new RegExp(check.pattern, 'i')
      if (regex.test(html)) {
        console.log(`✅ ${check.name} found`)
      } else {
        console.log(`❌ ${check.name} NOT found`)
      }
    })
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testContactLegacy()

