const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}
loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function directSQLCheck() {
  console.log('🔍 Прямая проверка SQL запросов...\n');

  try {
    // 1. Проверяем существование таблицы subcategories
    console.log('📋 Проверяю существование таблицы subcategories...');
    const { data: tableCheck, error: tableError } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'subcategories'" 
      });
    
    if (tableError) {
      console.log(`❌ Ошибка проверки таблицы: ${tableError.message}`);
    } else {
      console.log(`✅ Результат проверки таблицы:`, tableCheck);
    }

    // 2. Проверяем через простой SELECT
    console.log('\n📊 Проверяю через SELECT...');
    const { data: selectResult, error: selectError } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT COUNT(*) as count FROM subcategories" 
      });
    
    if (selectError) {
      console.log(`❌ Ошибка SELECT: ${selectError.message}`);
    } else {
      console.log(`✅ Результат SELECT:`, selectResult);
    }

    // 3. Проверяем структуру таблицы
    console.log('\n🏗️ Проверяю структуру таблицы...');
    const { data: structureResult, error: structureError } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subcategories' ORDER BY ordinal_position" 
      });
    
    if (structureError) {
      console.log(`❌ Ошибка проверки структуры: ${structureError.message}`);
    } else {
      console.log(`✅ Структура таблицы:`, structureResult);
    }

    // 4. Пробуем создать таблицу заново
    console.log('\n🔄 Создаю таблицу заново...');
    const createSQL = `
      DROP TABLE IF EXISTS public.subcategories CASCADE;
      CREATE TABLE public.subcategories (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX idx_subcategories_category_id ON public.subcategories(category_id);
      GRANT ALL ON public.subcategories TO anon, authenticated, service_role;
      GRANT USAGE, SELECT ON SEQUENCE public.subcategories_id_seq TO anon, authenticated, service_role;
    `;

    const { data: createResult, error: createError } = await supabase
      .rpc('exec_sql', { sql: createSQL });
    
    if (createError) {
      console.log(`❌ Ошибка создания таблицы: ${createError.message}`);
    } else {
      console.log(`✅ Таблица создана:`, createResult);
    }

    // 5. Проверяем снова
    console.log('\n🔍 Проверяю снова...');
    const { data: finalCheck, error: finalError } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT COUNT(*) as count FROM subcategories" 
      });
    
    if (finalError) {
      console.log(`❌ Финальная проверка не прошла: ${finalError.message}`);
    } else {
      console.log(`✅ Финальная проверка:`, finalCheck);
    }

    // 6. Проверяем через Supabase client
    console.log('\n🌐 Проверяю через Supabase client...');
    const { data: clientCheck, error: clientError } = await supabase
      .from('subcategories')
      .select('*')
      .limit(1);
    
    if (clientError) {
      console.log(`❌ Supabase client не видит таблицу: ${clientError.message}`);
    } else {
      console.log(`✅ Supabase client видит таблицу: ${clientCheck?.length || 0} записей`);
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

directSQLCheck();
