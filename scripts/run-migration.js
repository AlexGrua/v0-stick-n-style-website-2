const https = require('https');
const http = require('http');

async function executeMigration() {
  console.log('🚀 Выполняю миграцию 001...');
  
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
          console.log('📊 Результат:', JSON.stringify(result, null, 2));
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

executeMigration()
  .then(result => {
    console.log('✅ Миграция завершена');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Ошибка миграции:', error);
    process.exit(1);
  });
