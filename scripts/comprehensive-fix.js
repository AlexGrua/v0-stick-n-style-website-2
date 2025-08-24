const http = require('http');

async function checkDatabaseState() {
  console.log('🔍 Проверяю состояние базы данных...');
  
  const data = JSON.stringify({
    sql: `
      -- Проверка текущей БД и схемы
      SELECT current_database() as current_db, current_schema() as current_schema;
      
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
          console.log('📊 Состояние БД:');
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

async function forceReloadPostgREST() {
  console.log('🔄 Принудительно обновляю PostgREST кеш...');
  
  const data = JSON.stringify({
    sql: `
      -- Вариант 1: NOTIFY
      NOTIFY pgrst, 'reload schema';
      
      -- Вариант 2: pg_notify (на всякий случай)
      SELECT pg_notify('pgrst', 'reload schema');
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
          console.log('✅ PostgREST кеш обновлен');
          resolve(result);
        } catch (e) {
          console.log('📄 Сырой ответ:', responseData);
          resolve({ raw: responseData, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Ошибка обновления кеша:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function testDirectPostgREST() {
  console.log('🧪 Тестирую прямые PostgREST запросы...');
  
  const endpoints = [
    { path: '/rest/v1/products?select=*&limit=1', description: 'PostgREST Products' },
    { path: '/rest/v1/subcategories?select=*&limit=1', description: 'PostgREST Subcategories' },
    { path: '/rest/v1/categories?select=*&limit=1', description: 'PostgREST Categories' }
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
          JSON.parse(responseData);
          resolve({ success: true, status: res.statusCode });
        } catch (e) {
          resolve({ success: false, status: res.statusCode, error: e.message });
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
    { path: '/api/subcategories', description: 'API Subcategories' }
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
          JSON.parse(responseData);
          resolve({ success: true, status: res.statusCode });
        } catch (e) {
          resolve({ success: false, status: res.statusCode, error: e.message });
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
    console.log('🚀 КОМПЛЕКСНОЕ ИСПРАВЛЕНИЕ POSTGREST КЕША\n');
    
    // 1. Проверяем состояние БД
    console.log('📋 Шаг 1: Проверка состояния БД');
    await checkDatabaseState();
    
    // 2. Принудительно обновляем PostgREST кеш
    console.log('\n📋 Шаг 2: Обновление PostgREST кеша');
    await forceReloadPostgREST();
    
    // 3. Ждем обновления кеша
    console.log('\n⏳ Жду 10 секунд для обновления кеша...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 4. Тестируем прямые PostgREST запросы
    console.log('\n📋 Шаг 3: Тестирование прямых PostgREST запросов');
    await testDirectPostgREST();
    
    // 5. Тестируем API endpoints
    console.log('\n📋 Шаг 4: Тестирование API endpoints');
    await testAPIEndpoints();
    
    console.log('\n✅ Комплексное исправление завершено!');
    console.log('\n📋 СЛЕДУЮЩИЕ ШАГИ:');
    console.log('1. Если есть ошибки - перезапустите сервер разработки');
    console.log('2. Откройте админку http://localhost:3001/admin/catalog');
    console.log('3. Проверьте консоль браузера - ошибки FK должны исчезнуть');
    console.log('4. Попробуйте импорт продуктов');
    
  } catch (error) {
    console.error('❌ Ошибка комплексного исправления:', error);
    console.log('\n🔧 РУЧНОЕ РЕШЕНИЕ:');
    console.log('1. Откройте Supabase Console → SQL Editor');
    console.log('2. Выполните: NOTIFY pgrst, \'reload schema\';');
    console.log('3. Перезапустите API: Project Settings → API → Restart');
    console.log('4. Перезапустите сервер разработки');
  }
}

main();
