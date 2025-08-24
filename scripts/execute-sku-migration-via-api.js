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

async function executeMigration() {
  try {
    console.log('🚀 Начинаем миграцию SKU через API...');
    
    const baseUrl = 'http://localhost:3001'; // Используем порт 3001
    
    // 1. Выполняем миграцию через API endpoint
    console.log('📝 Выполняем миграцию SKU...');
    const migrationSql = fs.readFileSync('scripts/fix-sku-migration.sql', 'utf8');
    
    const response = await fetch(`${baseUrl}/api/migrations/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: migrationSql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ошибка миграции:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Миграция выполнена успешно!');
    console.log('📊 Результаты:', result);
    
    // 2. Перезагружаем кеш PostgREST
    console.log('🔄 Перезагружаем кеш PostgREST...');
    const reloadResponse = await fetch(`${baseUrl}/api/migrations/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: "NOTIFY pgrst, 'reload schema';"
      })
    });
    
    if (reloadResponse.ok) {
      console.log('✅ Кеш PostgREST обновлен!');
    }
    
    console.log('✅ Миграция завершена!');
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

executeMigration();
