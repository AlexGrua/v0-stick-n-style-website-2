const fs = require('fs');

async function testImport() {
  try {
    console.log('🧪 Тестируем импорт продуктов после миграции SKU...');
    
    const baseUrl = 'http://localhost:3001';
    
    // Создаем тестовый Excel файл
    const testData = [
      ['SKU *', 'Product Name *', 'Description *', 'Category Name *', 'Subcategory Name *', 'Supplier Code *', 'Size *', 'Thickness *', 'Color Name *'],
      ['TEST001', 'Test Product 1', 'Test Description', 'Mosaic', 'Glass Mosaic', 'SUP001', '10x10', '8mm', 'White'],
      ['TEST002', 'Test Product 2', 'Test Description 2', 'Mosaic', 'Glass Mosaic', 'SUP001', '15x15', '10mm', 'Black']
    ];
    
    // Создаем CSV для тестирования (проще чем Excel)
    const csvContent = testData.map(row => row.join(',')).join('\n');
    fs.writeFileSync('test-import.csv', csvContent);
    
    console.log('📄 Создан тестовый файл test-import.csv');
    
    // Тестируем API импорта
    console.log('📤 Тестируем API импорта...');
    
    // Сначала проверим reference endpoint
    const referenceResponse = await fetch(`${baseUrl}/api/products/import/reference`);
    if (referenceResponse.ok) {
      const referenceData = await referenceResponse.json();
      console.log('✅ Reference API работает');
      console.log('📊 Доступные категории:', referenceData.categories?.length || 0);
      console.log('📊 Доступные поставщики:', referenceData.suppliers?.length || 0);
    } else {
      console.log('❌ Reference API не работает');
    }
    
    // Тестируем создание продукта через основной API
    console.log('📝 Тестируем создание продукта...');
    const createResponse = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Product API',
        description: 'Test Description',
        category_id: 9, // Используем существующую категорию
        sku: 'API_TEST_001',
        status: 'inactive'
      })
    });
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Создание продукта работает');
      console.log('📋 Создан продукт:', {
        id: createResult.id,
        name: createResult.name,
        sku: createResult.sku
      });
    } else {
      const errorText = await createResponse.text();
      console.log('❌ Ошибка создания продукта:', errorText);
    }
    
    // Проверяем, что продукт появился в списке
    console.log('📋 Проверяем список продуктов...');
    const listResponse = await fetch(`${baseUrl}/api/products?limit=10`);
    if (listResponse.ok) {
      const listResult = await listResponse.json();
      console.log('✅ Список продуктов работает');
      console.log('📊 Всего продуктов:', listResult.total);
      console.log('📋 Последние продукты:');
      listResult.items?.slice(-3).forEach(product => {
        console.log(`  - ${product.name} (SKU: ${product.sku})`);
      });
    }
    
    console.log('✅ Тестирование завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  }
}

testImport();
