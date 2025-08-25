async function testContactConsole() {
  console.log('🧪 Testing Contact page console logs...')
  
  try {
    // Тестируем страницу Contact с параметром newblocks=1
    const response = await fetch('http://localhost:3000/contact?newblocks=1')
    
    if (!response.ok) {
      console.log(`❌ Page error: ${response.status} ${response.statusText}`)
      return
    }
    
    const html = await response.text()
    console.log('✅ Contact page loaded successfully')
    
    // Проверяем наличие debug информации
    if (html.includes('blocks: 3')) {
      console.log('✅ Debug info found: blocks: 3')
    } else {
      console.log('⚠️ Debug info not found or incorrect')
    }
    
    // Проверяем наличие block-renderer div
    if (html.includes('class="block-renderer"')) {
      console.log('✅ block-renderer div found')
    } else {
      console.log('⚠️ block-renderer div not found')
    }
    
    // Проверяем наличие компонентов блоков
    const blockComponents = ['contactsHero', 'contactFormBlock', 'contactChannels']
    let foundComponents = 0
    
    blockComponents.forEach(component => {
      if (html.includes(component)) {
        foundComponents++
        console.log(`✅ ${component} found`)
      } else {
        console.log(`⚠️ ${component} not found`)
      }
    })
    
    console.log(`📊 Found ${foundComponents}/${blockComponents.length} block components`)
    
    // Проверяем наличие заголовка Contact Us
    if (html.includes('Contact Us')) {
      console.log('✅ Contact Us title found')
    } else {
      console.log('⚠️ Contact Us title not found')
    }
    
    // Проверяем наличие формы
    if (html.includes('form') || html.includes('input')) {
      console.log('✅ Contact form found')
    } else {
      console.log('⚠️ Contact form not found')
    }
    
    console.log('📄 Page length:', html.length, 'characters')
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testContactConsole()
