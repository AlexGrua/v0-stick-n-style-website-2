const http = require('http');

async function forceReloadSchema() {
  console.log('🔄 Принудительно обновляю PostgREST кеш...');
  
  const data = JSON.stringify({
    sql: 'NOTIFY pgrst, \'reload schema\';'
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
          console.log('📊 Результат обновления кеша:');
          console.log(JSON.stringify(result, null, 2));
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

async function waitAndTest() {
  console.log('⏳ Жду 5 секунд для обновления кеша...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('🧪 Тестирую API после обновления кеша...');
  
  const endpoints = [
    { path: '/api/products?limit=1', description: 'Products API' },
    { path: '/api/categories', description: 'Categories API' },
    { path: '/api/subcategories', description: 'Subcategories API' }
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
    console.log('🚀 Начинаю принудительное обновление кеша...\n');
    
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
    console.log('\n🔧 Альтернативное решение:');
    console.log('1. Перезапустите сервер разработки (Ctrl+C, затем npm run dev)');
    console.log('2. Или выполните SQL в Supabase Console: NOTIFY pgrst, \'reload schema\';');
  }
}

main();
