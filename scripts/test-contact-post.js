async function testContactPost() {
  console.log('🧪 Testing Contact POST API...')
  
  try {
    // Test POST request
    const testBlocks = [
      {
        id: 1,
        type: "contactsHero",
        props: {
          title: "Contact Us",
          subtitle: "Tell us about your project or request a quote."
        },
        position: 0,
        is_active: true
      }
    ]
    
    const response = await fetch('http://localhost:3001/api/pages/contact/blocks', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': 'session=test' // Add some auth
      },
      body: JSON.stringify({ blocks: testBlocks })
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ POST error: ${response.status} ${response.statusText}`)
      console.log('Error body:', errorText)
      return
    }
    
    const data = await response.json()
    console.log('✅ POST response:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testContactPost()

