const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function executeSQL() {
  console.log('🚀 Выполняю миграцию через Supabase CLI...');
  
  const sqlFile = path.join(__dirname, 'execute-migration-full.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');
  
  console.log('📝 SQL содержимое:');
  console.log('='.repeat(50));
  console.log(sqlContent);
  console.log('='.repeat(50));
  
  // Выполняем SQL через Supabase CLI
  const command = `supabase db reset --linked`;
  
  console.log('🔧 Выполняю команду:', command);
  
  return new Promise((resolve, reject) => {
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Ошибка выполнения:', error);
        console.error('stderr:', stderr);
        reject(error);
        return;
      }
      
      console.log('✅ Результат выполнения:');
      console.log(stdout);
      resolve(stdout);
    });
  });
}

// Альтернативный способ - через psql
async function executeSQLViaPsql() {
  console.log('🚀 Выполняю миграцию через psql...');
  
  const sqlFile = path.join(__dirname, 'execute-migration-full.sql');
  
  // Получаем переменные окружения
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Не найдены переменные окружения SUPABASE_URL или SERVICE_ROLE_KEY');
    return;
  }
  
  // Извлекаем host и port из URL
  const url = new URL(supabaseUrl);
  const host = url.hostname;
  const port = url.port || 5432;
  const database = 'postgres';
  
  const command = `psql "postgresql://postgres:${serviceKey}@${host}:${port}/${database}" -f "${sqlFile}"`;
  
  console.log('🔧 Выполняю команду psql...');
  
  return new Promise((resolve, reject) => {
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Ошибка выполнения psql:', error);
        console.error('stderr:', stderr);
        reject(error);
        return;
      }
      
      console.log('✅ Результат выполнения psql:');
      console.log(stdout);
      resolve(stdout);
    });
  });
}

// Основная функция
async function main() {
  try {
    console.log('🎯 Начинаю выполнение миграции...');
    
    // Пробуем через Supabase CLI
    try {
      await executeSQL();
      console.log('✅ Миграция выполнена через Supabase CLI');
    } catch (error) {
      console.log('⚠️ Supabase CLI не сработал, пробуем через psql...');
      
      // Пробуем через psql
      try {
        await executeSQLViaPsql();
        console.log('✅ Миграция выполнена через psql');
      } catch (psqlError) {
        console.error('❌ Оба способа не сработали');
        console.error('📋 Инструкция для ручного выполнения:');
        console.error('1. Откройте Supabase Console → SQL Editor');
        console.error('2. Скопируйте содержимое файла scripts/execute-migration-full.sql');
        console.error('3. Выполните SQL');
        console.error('4. Вернитесь сюда и проверьте результат');
      }
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  }
}

main();
