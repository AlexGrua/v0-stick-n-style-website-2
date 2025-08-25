async function testContactAdminNew() {
  console.log('🧪 Testing NEW Contact admin page...')
  
  try {
    // Test admin page
    const response = await fetch('http://localhost:3001/admin/pages/contact')
    
    if (!response.ok) {
      console.log(`❌ Admin page error: ${response.status} ${response.statusText}`)
      return
    }
    
    const html = await response.text()
    console.log('✅ Contact admin page loaded successfully')
    console.log('📄 Page length:', html.length, 'characters')
    
    // Check for React hydration and client components
    const reactChecks = [
      { name: 'React hydration', pattern: '__NEXT_DATA__' },
      { name: 'Client component script', pattern: 'PageBlocksEditor' },
      { name: 'Contact page component', pattern: 'ContactEditor' },
      { name: 'Next.js app', pattern: 'next' },
      { name: 'React app', pattern: 'react' }
    ]
    
    reactChecks.forEach(check => {
      const regex = new RegExp(check.pattern, 'i')
      if (regex.test(html)) {
        console.log(`✅ ${check.name} found`)
      } else {
        console.log(`⚠️ ${check.name} NOT found`)
      }
    })
    
    // Check for specific content that should be rendered
    const contentChecks = [
      { name: 'Contact page title', pattern: 'Contact.*Editor|Editor.*Contact' },
      { name: 'Block editor UI', pattern: 'Current Blocks|Preview|Save Draft|Publish' },
      { name: 'Block types', pattern: 'contactsHero|contactFormBlock|contactChannels' },
      { name: 'Edit functionality', pattern: 'Edit|ArrowUp|ArrowDown' }
    ]
    
    contentChecks.forEach(check => {
      const regex = new RegExp(check.pattern, 'i')
      if (regex.test(html)) {
        console.log(`✅ ${check.name} found`)
      } else {
        console.log(`⚠️ ${check.name} NOT found`)
      }
    })
    
    // Show a snippet of the HTML to debug
    console.log('\n📄 HTML snippet (first 500 chars):')
    console.log(html.substring(0, 500))
    
    // Check for any error messages
    if (html.includes('error') || html.includes('Error') || html.includes('ERROR')) {
      console.log('\n⚠️ Found potential error messages in HTML')
      const errorMatches = html.match(/error[^<]*/gi)
      if (errorMatches) {
        errorMatches.slice(0, 5).forEach(match => console.log('  -', match))
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testContactAdminNew()
