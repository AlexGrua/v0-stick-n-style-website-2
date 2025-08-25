async function testContactPage() {
  console.log('🧪 Testing Contact page...')
  
  try {
    // Тестируем страницу Contact с параметром newblocks=1
    const response = await fetch('http://localhost:3000/contact?newblocks=1')
    
    if (!response.ok) {
      console.log(`❌ Page error: ${response.status} ${response.statusText}`)
      return
    }
    
    const html = await response.text()
    console.log('✅ Contact page loaded successfully')
    
    // Проверяем наличие блоков в HTML
    if (html.includes('contactsHero') || html.includes('contactFormBlock') || html.includes('contactChannels')) {
      console.log('✅ Block components found in HTML')
    } else {
      console.log('⚠️ Block components not found in HTML')
    }
    
    // Проверяем наличие заголовка
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

testContactPage()

