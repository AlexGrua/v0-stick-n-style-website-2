const http = require('http');

async function checkDatabaseState() {
  console.log('🔍 Проверяю состояние базы данных после исправления...');
  
  const data = JSON.stringify({
    sql: `
      -- Проверка существования таблицы subcategories
      SELECT to_regclass('public.subcategories') as subcategories_table;
      
      -- Проверка колонок в products
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns
      WHERE table_schema='public' 
        AND table_name='products' 
        AND column_name IN ('sku','subcategory_id','specifications');
      
      -- Проверка FK связей
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('products', 'subcategories');
    `
  });
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/migrations/execute-sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          console.log('📊 Состояние БД после исправления:');
          console.log(JSON.stringify(result, null, 2));
          resolve(result);
        } catch (e) {
          console.log('📄 Сырой ответ:', responseData);
          resolve({ raw: responseData, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Ошибка проверки БД:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function testDirectPostgREST() {
  console.log('🧪 Тестирую прямые PostgREST запросы...');
  
  const endpoints = [
    { path: '/rest/v1/subcategories?select=id,category_id,slug&limit=1', description: 'PostgREST Subcategories' },
    { path: '/rest/v1/products?select=id,sku,subcategory_id&limit=1', description: 'PostgREST Products' },
    { path: '/rest/v1/categories?select=id,name,slug&limit=1', description: 'PostgREST Categories' }
  ];

  for (const endpoint of endpoints) {
    try {
      const result = await testDirectEndpoint(endpoint.path, endpoint.description);
      console.log(`✅ ${endpoint.description}: ${result.status} - ${result.success ? 'OK' : 'ERROR'}`);
    } catch (error) {
      console.log(`❌ ${endpoint.description}: ERROR - ${error.message}`);
    }
  }
}

function testDirectEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'}`
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = JSON.parse(responseData);
          console.log(`📄 ${description} ответ:`, data);
          resolve({ success: true, status: res.statusCode, data });
        } catch (e) {
          resolve({ success: false, status: res.statusCode, error: e.message, raw: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testAPIEndpoints() {
  console.log('🧪 Тестирую API endpoints...');
  
  const endpoints = [
    { path: '/api/products?limit=1', description: 'API Products' },
    { path: '/api/categories', description: 'API Categories' },
    { path: '/api/subcategories', description: 'API Subcategories' },
    { path: '/api/products/import/reference', description: 'API Import Reference' }
  ];

  for (const endpoint of endpoints) {
    try {
      const result = await testAPIEndpoint(endpoint.path, endpoint.description);
      console.log(`✅ ${endpoint.description}: ${result.status} - ${result.success ? 'OK' : 'ERROR'}`);
    } catch (error) {
      console.log(`❌ ${endpoint.description}: ERROR - ${error.message}`);
    }
  }
}

function testAPIEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = JSON.parse(responseData);
          resolve({ success: true, status: res.statusCode, data });
        } catch (e) {
          resolve({ success: false, status: res.statusCode, error: e.message, raw: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🚀 ПРОВЕРКА ПОСЛЕ ИСПРАВЛЕНИЯ POSTGREST КЕША\n');
    
    // 1. Проверяем состояние БД
    console.log('📋 Шаг 1: Проверка состояния БД');
    await checkDatabaseState();
    
    // 2. Тестируем прямые PostgREST запросы
    console.log('\n📋 Шаг 2: Тестирование прямых PostgREST запросов');
    await testDirectPostgREST();
    
    // 3. Тестируем API endpoints
    console.log('\n📋 Шаг 3: Тестирование API endpoints');
    await testAPIEndpoints();
    
    console.log('\n✅ Проверка завершена!');
    console.log('\n📋 РЕЗУЛЬТАТ:');
    console.log('Если все тесты прошли успешно:');
    console.log('1. PostgREST кеш обновился ✅');
    console.log('2. Ошибки FK исчезли ✅');
    console.log('3. Импорт продуктов должен работать ✅');
    console.log('\n📋 СЛЕДУЮЩИЕ ШАГИ:');
    console.log('1. Откройте админку http://localhost:3001/admin/catalog');
    console.log('2. Проверьте консоль браузера - ошибки FK должны исчезнуть');
    console.log('3. Попробуйте импорт продуктов');
    
  } catch (error) {
    console.error('❌ Ошибка проверки:', error);
    console.log('\n🔧 Если есть проблемы:');
    console.log('1. Проверьте exposed schemas в Supabase Settings → API');
    console.log('2. Убедитесь что API перезапущен в Supabase');
    console.log('3. Перезапустите сервер разработки');
  }
}

main();
