async function testContact2Col() {
  console.log('🧪 Testing Contact two-column layout...')
  
  try {
    // Test public page with two-column layout
    const response = await fetch('http://localhost:3000/contact?layout=2col')
    
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      console.log(`❌ Public page error: ${response.status} ${response.statusText}`)
      return
    }
    
    const html = await response.text()
    console.log('✅ Contact two-column page loaded successfully')
    console.log('📄 Page length:', html.length, 'characters')
    
    // Check for two-column layout elements
    const checks = [
      { name: 'Two-column grid', pattern: 'lg:grid-cols-12' },
      { name: 'Main column', pattern: 'lg:col-span-7' },
      { name: 'Aside column', pattern: 'lg:col-span-5' },
      { name: 'Sticky aside', pattern: 'lg:sticky' },
      { name: 'Block renderer', pattern: 'block-renderer' },
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
    
    // Check for compact form elements
    const formChecks = [
      { name: 'Compact input height', pattern: 'h-10' },
      { name: 'Compact textarea', pattern: 'min-h-\\[80px\\]' },
      { name: 'Right-aligned button', pattern: 'flex justify-end' },
      { name: 'Compact button', pattern: 'px-5 py-2 text-sm' }
    ]
    
    formChecks.forEach(check => {
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

testContact2Col()

