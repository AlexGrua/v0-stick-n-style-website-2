const fs = require('fs');

// Загружаем переменные окружения из .env.local
const envPath = '.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

async function verifyMigrationComplete() {
  try {
    console.log('🔍 Проверяем успешность миграции...');
    
    const baseUrl = 'http://localhost:3000';
    
    // 1. Проверяем структуру таблицы products
    console.log('📝 Проверяем колонку sku в products...');
    const skuCheckResponse = await fetch(`${baseUrl}/api/migrations/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `
          SELECT 
            column_name, 
            data_type, 
            is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'products' 
          AND table_schema = 'public'
          AND column_name = 'sku';
        `
      })
    });
    
    if (skuCheckResponse.ok) {
      const skuCheck = await skuCheckResponse.json();
      console.log('📋 Проверка колонки sku:', skuCheck);
      
      if (skuCheck.data && skuCheck.data.length > 0) {
        console.log('✅ Колонка sku найдена!');
      } else {
        console.log('❌ Колонка sku НЕ найдена!');
      }
    }
    
    // 2. Проверяем таблицу subcategories
    console.log('📝 Проверяем таблицу subcategories...');
    const subcategoriesCheckResponse = await fetch(`${baseUrl}/api/migrations/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `
          SELECT 
            table_name,
            table_type
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'subcategories';
        `
      })
    });
    
    if (subcategoriesCheckResponse.ok) {
      const subcategoriesCheck = await subcategoriesCheckResponse.json();
      console.log('📋 Проверка таблицы subcategories:', subcategoriesCheck);
      
      if (subcategoriesCheck.data && subcategoriesCheck.data.length > 0) {
        console.log('✅ Таблица subcategories найдена!');
      } else {
        console.log('❌ Таблица subcategories НЕ найдена!');
      }
    }
    
    // 3. Проверяем индексы
    console.log('📝 Проверяем индексы...');
    const indexesCheckResponse = await fetch(`${baseUrl}/api/migrations/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `
          SELECT 
            indexname,
            indexdef
          FROM pg_indexes 
          WHERE tablename = 'products' 
          AND indexname LIKE '%sku%';
        `
      })
    });
    
    if (indexesCheckResponse.ok) {
      const indexesCheck = await indexesCheckResponse.json();
      console.log('📋 Проверка индексов SKU:', indexesCheck);
      
      if (indexesCheck.data && indexesCheck.data.length > 0) {
        console.log('✅ Индекс SKU найден!');
      } else {
        console.log('❌ Индекс SKU НЕ найден!');
      }
    }
    
    // 4. Тестируем API
    console.log('🧪 Тестируем API...');
    
    // Тест создания продукта
    const createProductResponse = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Product Migration',
        description: 'Test Description',
        category_id: 1,
        sku: 'TEST_MIGRATION_001',
        price: 100,
        in_stock: true
      })
    });
    
    if (createProductResponse.ok) {
      const createResult = await createProductResponse.json();
      console.log('✅ Создание продукта работает!');
      console.log('📋 Создан продукт:', {
        id: createResult.id,
        name: createResult.name,
        sku: createResult.sku
      });
    } else {
      const errorText = await createProductResponse.text();
      console.log('❌ Ошибка создания продукта:', errorText);
    }
    
    // Тест получения продуктов
    const getProductsResponse = await fetch(`${baseUrl}/api/products?limit=5`);
    if (getProductsResponse.ok) {
      const productsResult = await getProductsResponse.json();
      console.log('✅ Получение продуктов работает!');
      console.log('📊 Всего продуктов:', productsResult.total);
    } else {
      const errorText = await getProductsResponse.text();
      console.log('❌ Ошибка получения продуктов:', errorText);
    }
    
    console.log('✅ Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка проверки:', error);
  }
}

verifyMigrationComplete();
