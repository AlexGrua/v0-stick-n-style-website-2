const http = require('http');

async function checkMigrationResult() {
  console.log('🔍 Проверяю результат миграции...');
  
  const data = JSON.stringify({});
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/migrations/execute',
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
          console.log('📊 Результат проверки:');
          console.log(JSON.stringify(result, null, 2));
          
          if (result.success) {
            console.log('✅ Миграция выполнена успешно!');
            console.log('📋 Проверьте:');
            console.log('1. Откройте админку http://localhost:3001/admin/catalog');
            console.log('2. Проверьте что нет ошибок FK в консоли');
            console.log('3. Попробуйте импорт продуктов');
          } else {
            console.log('❌ Миграция не выполнена');
            console.log('🔧 Нужно выполнить SQL вручную');
          }
          
          resolve(result);
        } catch (e) {
          console.log('📄 Сырой ответ:', responseData);
          resolve({ raw: responseData, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Ошибка запроса:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

checkMigrationResult()
  .then(result => {
    console.log('✅ Проверка завершена');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Ошибка проверки:', error);
    process.exit(1);
  });
