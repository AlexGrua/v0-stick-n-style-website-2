async function testReferenceAPI() {
  try {
    console.log('🔍 Тестируем API reference данных...\n')
    
    const response = await fetch('http://localhost:3000/api/products/import/reference')
    const data = await response.json()
    
    console.log('✅ API ответ получен')
    console.log(`📊 Категорий: ${data.categories.length}`)
    console.log(`📊 Поставщиков: ${data.suppliers.length}\n`)
    
    // Проверяем категории и их подкатегории
    console.log('📋 Категории и подкатегории:')
    data.categories.forEach(cat => {
      console.log(`\n🏷️  ${cat.name} (ID: ${cat.id}, slug: ${cat.slug})`)
      if (cat.subcategories && cat.subcategories.length > 0) {
        cat.subcategories.forEach(sub => {
          console.log(`   └─ ${sub.name} (ID: ${sub.id}, slug: ${sub.slug})`)
        })
      } else {
        console.log('   └─ Нет подкатегорий')
      }
    })
    
    // Проверяем поставщиков
    console.log('\n🏢 Поставщики:')
    data.suppliers.forEach(sup => {
      console.log(`   - ${sup.name} (ID: ${sup.id}, код: ${sup.code})`)
    })
    
    // Проверяем конкретно Wall Panel
    const wallPanel = data.categories.find(cat => cat.name === 'Wall Panel')
    if (wallPanel) {
      console.log('\n🎯 Wall Panel подкатегории:')
      if (wallPanel.subcategories && wallPanel.subcategories.length > 0) {
        wallPanel.subcategories.forEach(sub => {
          console.log(`   - ${sub.name} (ID: ${sub.id})`)
        })
      } else {
        console.log('   ⚠️  Подкатегории не найдены!')
      }
    } else {
      console.log('\n❌ Категория Wall Panel не найдена!')
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования API:', error)
  }
}

testReferenceAPI()
