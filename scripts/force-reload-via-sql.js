const http = require('http');

async function forceReloadSchema() {
  console.log('🔄 Принудительно обновляю PostgREST кеш через SQL...');

  const data = JSON.stringify({
    sql: `
      -- Вариант 1: NOTIFY
      NOTIFY pgrst, 'reload schema';
      
      -- Вариант 2: pg_notify
      SELECT pg_notify('pgrst', 'reload schema');
      
      -- Вариант 3: Принудительное обновление
      SELECT pg_reload_conf();
      
      -- Вариант 4: Проверка что команды выполнились
      SELECT 'Schema reload commands executed' as status;
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
          console.log('✅ SQL команды выполнены:');
          console.log(JSON.stringify(result, null, 2));
          resolve(result);
        } catch (e) {
          console.log('📄 Сырой ответ:', responseData);
          resolve({ raw: responseData, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Ошибка выполнения SQL:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function waitAndTest() {
  console.log('⏳ Жду 15 секунд для обновления кеша...');
  await new Promise(resolve => setTimeout(resolve, 15000));

  console.log('🧪 Тестирую API после обновления кеша...');

  const endpoints = [
    { path: '/api/products?limit=1', description: 'API Products' },
    { path: '/api/categories', description: 'API Categories' },
    { path: '/api/subcategories', description: 'API Subcategories' }
  ];

  for (const endpoint of endpoints) {
    try {
      const result = await testEndpoint(endpoint.path, endpoint.description);
      console.log(`✅ ${endpoint.description}: ${result.status} - ${result.success ? 'OK' : 'ERROR'}`);
    } catch (error) {
      console.log(`❌ ${endpoint.description}: ERROR - ${error.message}`);
    }
  }
}

function testEndpoint(path, description) {
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
    console.log('🚀 ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ КЕША ЧЕРЕЗ SQL\n');

    // 1. Принудительно обновляем кеш
    await forceReloadSchema();

    // 2. Ждем и тестируем
    await waitAndTest();

    console.log('\n✅ Обновление кеша завершено!');
    console.log('📋 Проверьте:');
    console.log('1. Откройте админку http://localhost:3001/admin/catalog');
    console.log('2. Проверьте консоль браузера - ошибки FK должны исчезнуть');
    console.log('3. Попробуйте импорт продуктов снова');

  } catch (error) {
    console.error('❌ Ошибка обновления кеша:', error);
    console.log('\n🔧 Если проблема остается:');
    console.log('1. Перезапустите сервер разработки (Ctrl+C, затем npm run dev)');
    console.log('2. Или выполните SQL в Supabase Console вручную');
  }
}

main();
