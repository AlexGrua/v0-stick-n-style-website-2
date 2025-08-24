const http = require('http');

async function testAPIEndpoint(path, description) {
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
          const result = JSON.parse(responseData);
          console.log(`✅ ${description}: ${res.statusCode} - OK`);
          resolve({ success: true, status: res.statusCode, data: result });
        } catch (e) {
          console.log(`❌ ${description}: ${res.statusCode} - Parse Error`);
          resolve({ success: false, status: res.statusCode, error: e.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description}: Connection Error - ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🧪 Тестирую API endpoints после миграции...\n');

  const endpoints = [
    { path: '/api/products?limit=1', description: 'Products API' },
    { path: '/api/categories', description: 'Categories API' },
    { path: '/api/suppliers', description: 'Suppliers API' },
    { path: '/api/products/import/reference', description: 'Import Reference API' },
    { path: '/api/subcategories', description: 'Subcategories API' }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    const result = await testAPIEndpoint(endpoint.path, endpoint.description);
    results.push({ endpoint: endpoint.description, ...result });
  }

  console.log('\n📊 Результаты тестирования:');
  console.log('='.repeat(50));
  
  let successCount = 0;
  let errorCount = 0;

  results.forEach(result => {
    if (result.success) {
      successCount++;
      console.log(`✅ ${result.endpoint}: Успешно`);
    } else {
      errorCount++;
      console.log(`❌ ${result.endpoint}: Ошибка - ${result.error || 'Unknown'}`);
    }
  });

  console.log('\n📈 Статистика:');
  console.log(`✅ Успешно: ${successCount}`);
  console.log(`❌ Ошибок: ${errorCount}`);
  console.log(`📊 Всего: ${results.length}`);

  if (errorCount === 0) {
    console.log('\n🎉 Все API endpoints работают корректно!');
    console.log('✅ Миграция выполнена успешно!');
    console.log('📋 Следующие шаги:');
    console.log('1. Откройте админку http://localhost:3001/admin/catalog');
    console.log('2. Проверьте что нет ошибок FK в консоли браузера');
    console.log('3. Попробуйте импорт продуктов');
  } else {
    console.log('\n⚠️ Есть проблемы с API endpoints');
    console.log('🔧 Проверьте логи приложения для деталей');
  }

  return results;
}

testAllEndpoints()
  .then(results => {
    console.log('\n✅ Тестирование завершено');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Ошибка тестирования:', error);
    process.exit(1);
  });
