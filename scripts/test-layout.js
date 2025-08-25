async function testLayout() {
  console.log('🔍 Проверяю раскладку на /contact...')
  
  try {
    const response = await fetch('http://localhost:3000/contact')
    const html = await response.text()
    
    if (response.ok) {
      console.log('✅ Страница загружена')
      
      const hasGrid = html.includes('grid-cols-1 lg:grid-cols-12')
      const hasLeftCol = html.includes('lg:col-span-7')
      const hasRightCol = html.includes('lg:col-span-5')
      
      console.log('📊 Раскладка:')
      console.log(`   Grid: ${hasGrid ? '✅' : '❌'}`)
      console.log(`   Left (7/12): ${hasLeftCol ? '✅' : '❌'}`)
      console.log(`   Right (5/12): ${hasRightCol ? '✅' : '❌'}`)
      
      if (hasGrid && hasLeftCol && hasRightCol) {
        console.log('🎉 Двухколоночная раскладка работает!')
      } else {
        console.log('⚠️  Одна колонка')
      }
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message)
  }
}

testLayout()
