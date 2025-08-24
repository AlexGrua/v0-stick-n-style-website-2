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

async function verifyAfterDuplicateFix() {
  try {
    console.log('🔍 Проверяем состояние после исправления дубликатов...');
    
    const baseUrl = 'http://localhost:3000';
    
    // 1. Проверяем дубликаты SKU
    console.log('📝 Проверяем дубликаты SKU...');
    const duplicatesResponse = await fetch(`${baseUrl}/api/migrations/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `
          SELECT 
            sku, 
            count(*) as duplicates
          FROM public.products
          WHERE sku IS NOT NULL AND sku <> ''
          GROUP BY sku
          HAVING count(*) > 1
          ORDER BY count(*) DESC;
        `
      })
    });
    
    if (duplicatesResponse.ok) {
      const duplicates = await duplicatesResponse.json();
      console.log('📋 Дубликаты SKU:', duplicates);
      
      if (duplicates.data && duplicates.data.length === 0) {
        console.log('✅ Дубликаты SKU устранены!');
      } else {
        console.log('❌ Дубликаты SKU все еще есть:', duplicates.data);
      }
    }
    
    // 2. Проверяем уникальный индекс
    console.log('📝 Проверяем уникальный индекс SKU...');
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
      const indexes = await indexResponse.json();
      console.log('📋 Индексы SKU:', indexes);
      
      if (indexes.data && indexes.data.length > 0) {
        console.log('✅ Уникальный индекс SKU создан!');
      } else {
        console.log('❌ Уникальный индекс SKU НЕ создан!');
      }
    }
    
    // 3. Тестируем создание продукта
    console.log('🧪 Тестируем создание продукта...');
    const createResponse = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Product After Fix',
        description: 'Test Description',
        category_id: 1,
        sku: 'TEST_AFTER_FIX_001',
        price: 100,
        in_stock: true
      })
    });
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Создание продукта работает!');
      console.log('📋 Создан продукт:', {
        id: createResult.id,
        name: createResult.name,
        sku: createResult.sku
      });
    } else {
      const errorText = await createResponse.text();
      console.log('❌ Ошибка создания продукта:', errorText);
    }
    
    // 4. Тестируем создание продукта с дублирующимся SKU
    console.log('🧪 Тестируем создание продукта с дублирующимся SKU...');
    const duplicateResponse = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Product Duplicate SKU',
        description: 'Test Description',
        category_id: 1,
        sku: 'TEST_AFTER_FIX_001', // Тот же SKU
        price: 100,
        in_stock: true
      })
    });
    
    if (duplicateResponse.ok) {
      console.log('❌ Дублирующийся SKU был создан - индекс не работает!');
    } else {
      console.log('✅ Дублирующийся SKU заблокирован - индекс работает!');
    }
    
    // 5. Проверяем статистику
    console.log('📊 Проверяем статистику...');
    const statsResponse = await fetch(`${baseUrl}/api/migrations/execute-sql`, {
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
          WHERE sku IS NOT NULL AND sku <> ''
          UNION ALL
          SELECT 
            'Unique SKUs' as metric,
            count(DISTINCT sku) as value
          FROM public.products
          WHERE sku IS NOT NULL AND sku <> '';
        `
      })
    });
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('📊 Статистика:', stats);
    }
    
    console.log('✅ Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка проверки:', error);
  }
}

verifyAfterDuplicateFix();
