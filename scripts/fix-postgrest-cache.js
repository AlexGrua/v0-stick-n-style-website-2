const http = require('http');

async function forceReloadPostgREST() {
  console.log('🔄 Принудительно обновляю PostgREST кеш...');

  const sqlCommands = [
    'NOTIFY pgrst, \'reload schema\';',
    'SELECT pg_notify(\'pgrst\', \'reload schema\');',
    'SELECT pg_reload_conf();',
    'SELECT pg_notify(\'pgrst\', \'reload schema\');',
    'SELECT pg_notify(\'pgrst\', \'reload schema\');'
  ];

  for (let i = 0; i < sqlCommands.length; i++) {
    const sql = sqlCommands[i];
    console.log(`📝 Шаг ${i + 1}: ${sql}`);
    
    const data = JSON.stringify({ sql });
    
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

    try {
      const result = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let responseData = '';
          
          res.on('data', (chunk) => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            try {
              const result = JSON.parse(responseData);
              resolve(result);
            } catch (e) {
              resolve({ raw: responseData, status: res.statusCode });
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.write(data);
        req.end();
      });

      console.log(`✅ Шаг ${i + 1} выполнен`);
      
      // Ждем между командами
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`❌ Ошибка шага ${i + 1}:`, error);
    }
  }

  console.log('\n⏳ Жду 15 секунд для полного обновления кеша...');
  await new Promise(resolve => setTimeout(resolve, 15000));

  console.log('🧪 Тестирую API после обновления кеша...');
  
  // Тестируем ключевые endpoints
  const endpoints = [
    { path: '/api/products?limit=1', name: 'Products API' },
    { path: '/api/categories', name: 'Categories API' },
    { path: '/api/subcategories', name: 'Subcategories API' },
    { path: '/api/suppliers', name: 'Suppliers API' }
  ];

  for (const endpoint of endpoints) {
    try {
      const result = await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: 3001,
          path: endpoint.path,
          method: 'GET'
        }, (res) => {
          let responseData = '';
          
          res.on('data', (chunk) => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            resolve({ status: res.statusCode, data: responseData });
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.end();
      });

      console.log(`✅ ${endpoint.name}: ${result.status}`);
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Ошибка - ${error.message}`);
    }
  }

  console.log('\n✅ Обновление кеша завершено!');
  console.log('📋 Теперь попробуйте создать категорию снова');
}

forceReloadPostgREST();
