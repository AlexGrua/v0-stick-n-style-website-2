const { createClient } = require('@supabase/supabase-js');
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

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function executeMigration() {
  try {
    console.log('🚀 Начинаем миграцию SKU...');
    
    // 1. Сначала проверим дубликаты
    console.log('📝 Проверяем дубликаты SKU...');
    const checkSql = fs.readFileSync('scripts/check-sku-duplicates.sql', 'utf8');
    const { data: duplicates, error: checkError } = await supabase.rpc('exec_sql', { sql: checkSql });
    
    if (checkError) {
      console.error('❌ Ошибка проверки дубликатов:', checkError);
      return;
    }
    
    console.log('📊 Результаты проверки дубликатов:');
    console.log(duplicates);
    
    // 2. Выполняем основную миграцию
    console.log('📝 Выполняем миграцию SKU...');
    const migrationSql = fs.readFileSync('scripts/fix-sku-migration.sql', 'utf8');
    const { data: result, error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSql });
    
    if (migrationError) {
      console.error('❌ Ошибка миграции:', migrationError);
      return;
    }
    
    console.log('✅ Миграция выполнена успешно!');
    console.log('📊 Результаты:');
    console.log(result);
    
    // 3. Перезагружаем кеш PostgREST
    console.log('🔄 Перезагружаем кеш PostgREST...');
    await supabase.rpc('exec_sql', { sql: "NOTIFY pgrst, 'reload schema';" });
    
    console.log('✅ Миграция завершена!');
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

executeMigration();
