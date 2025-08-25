async function testContactPublic() {
  console.log('🧪 Testing Contact public page...')
  
  try {
    // Test public page with newblocks=1
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
    
    // Show a snippet of the HTML to debug
    console.log('\n📄 HTML snippet (first 1000 chars):')
    console.log(html.substring(0, 1000))
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testContactPublic()

