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

async function checkCurrentSchema() {
  try {
    console.log('🔍 Проверяем текущую схему базы данных...');
    
    const baseUrl = 'http://localhost:3000'; // Используем порт 3000
    
    // 1. Проверяем структуру таблицы products
    console.log('📝 Проверяем структуру таблицы products...');
    const productsStructureResponse = await fetch(`${baseUrl}/api/migrations/execute-sql`, {
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
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })
    });
    
    if (productsStructureResponse.ok) {
      const productsStructure = await productsStructureResponse.json();
      console.log('📋 Структура таблицы products:');
      console.log(productsStructure);
    }
    
    // 2. Проверяем существование таблицы subcategories
    console.log('📝 Проверяем существование таблицы subcategories...');
    const subcategoriesResponse = await fetch(`${baseUrl}/api/migrations/execute-sql`, {
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
          AND table_name IN ('subcategories', 'categories', 'products', 'suppliers')
          ORDER BY table_name;
        `
      })
    });
    
    if (subcategoriesResponse.ok) {
      const tables = await subcategoriesResponse.json();
      console.log('📋 Существующие таблицы:');
      console.log(tables);
    }
    
    // 3. Проверяем данные в products
    console.log('📊 Проверяем данные в products...');
    const productsDataResponse = await fetch(`${baseUrl}/api/migrations/execute-sql`, {
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
            'Products with specifications' as metric,
            count(*) as value
          FROM public.products
          WHERE specifications is not null
          UNION ALL
          SELECT 
            'Sample specifications' as metric,
            count(*) as value
          FROM public.products
          WHERE specifications ? 'sku';
        `
      })
    });
    
    if (productsDataResponse.ok) {
      const productsData = await productsDataResponse.json();
      console.log('📊 Статистика products:');
      console.log(productsData);
    }
    
    console.log('✅ Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка проверки:', error);
  }
}

checkCurrentSchema();
