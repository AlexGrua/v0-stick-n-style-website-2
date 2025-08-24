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

async function verifyMigration() {
  try {
    console.log('🔍 Проверяем результаты миграции SKU...');
    
    const baseUrl = 'http://localhost:3001';
    
    // 1. Проверяем структуру таблицы
    console.log('📝 Проверяем структуру таблицы products...');
    const structureResponse = await fetch(`${baseUrl}/api/migrations/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `
          SELECT 
            column_name, 
            data_type, 
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'products' 
          AND column_name = 'sku'
          ORDER BY ordinal_position;
        `
      })
    });
    
    if (structureResponse.ok) {
      const structureResult = await structureResponse.json();
      console.log('✅ Структура колонки SKU:', structureResult);
    }
    
    // 2. Проверяем данные
    console.log('📊 Проверяем данные в колонке SKU...');
    const dataResponse = await fetch(`${baseUrl}/api/migrations/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `
          SELECT 
            'Total products' as metric,
            count(*) as value
          FROM public.products
          UNION ALL
          SELECT 
            'Products with SKU' as metric,
            count(*) as value
          FROM public.products
          WHERE sku is not null and sku <> ''
          UNION ALL
          SELECT 
            'Products without SKU' as metric,
            count(*) as value
          FROM public.products
          WHERE sku is null or sku = ''
          UNION ALL
          SELECT 
            'Unique SKUs' as metric,
            count(distinct sku) as value
          FROM public.products
          WHERE sku is not null and sku <> '';
        `
      })
    });
    
    if (dataResponse.ok) {
      const dataResult = await dataResponse.json();
      console.log('📊 Статистика SKU:', dataResult);
    }
    
    // 3. Проверяем индексы
    console.log('🔍 Проверяем индексы...');
    const indexResponse = await fetch(`${baseUrl}/api/migrations/execute-sql`, {
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
    
    if (indexResponse.ok) {
      const indexResult = await indexResponse.json();
      console.log('🔍 Индексы SKU:', indexResult);
    }
    
    // 4. Тестируем API
    console.log('🧪 Тестируем API продуктов...');
    const apiResponse = await fetch(`${baseUrl}/api/products?limit=5`);
    
    if (apiResponse.ok) {
      const apiResult = await apiResponse.json();
      console.log('✅ API работает, получено продуктов:', apiResult.items?.length || 0);
      
      if (apiResult.items && apiResult.items.length > 0) {
        const firstProduct = apiResult.items[0];
        console.log('📋 Пример продукта:', {
          id: firstProduct.id,
          name: firstProduct.name,
          sku: firstProduct.sku,
          category: firstProduct.category
        });
      }
    }
    
    console.log('✅ Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка проверки:', error);
  }
}

verifyMigration();
