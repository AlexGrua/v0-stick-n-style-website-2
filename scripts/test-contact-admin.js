async function testContactAdmin() {
  console.log('🧪 Testing Contact admin page...')
  
  try {
    // Тестируем админскую страницу Contact
    const response = await fetch('http://localhost:3000/admin/pages/contact')
    
    if (!response.ok) {
      console.log(`❌ Admin page error: ${response.status} ${response.statusText}`)
      return
    }
    
    const html = await response.text()
    console.log('✅ Contact admin page loaded successfully')
    
    // Проверяем наличие элементов админки
    if (html.includes('Contact Us Page - Block Editor')) {
      console.log('✅ Admin title found')
    } else {
      console.log('⚠️ Admin title not found')
    }
    
    // Проверяем наличие блоков
    if (html.includes('contactsHero') || html.includes('contactFormBlock') || html.includes('contactChannels')) {
      console.log('✅ Block types found in admin')
    } else {
      console.log('⚠️ Block types not found in admin')
    }
    
    // Проверяем наличие кнопок Edit
    if (html.includes('Edit')) {
      console.log('✅ Edit buttons found')
    } else {
      console.log('⚠️ Edit buttons not found')
    }
    
    // Проверяем наличие превью
    if (html.includes('Preview')) {
      console.log('✅ Preview section found')
    } else {
      console.log('⚠️ Preview section not found')
    }
    
    // Проверяем статус блоков
    if (html.includes('Active: Yes')) {
      console.log('✅ Active blocks found')
    } else if (html.includes('Active: No')) {
      console.log('⚠️ Inactive blocks found')
    } else {
      console.log('⚠️ Block status not found')
    }
    
    console.log('📄 Admin page length:', html.length, 'characters')
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testContactAdmin()

