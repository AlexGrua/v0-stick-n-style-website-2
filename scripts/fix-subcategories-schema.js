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

async function fixSubcategoriesSchema() {
  console.log('🔧 Проверяю и исправляю схему subcategories...\n');

  try {
    // 1. Проверяем, где находится таблица subcategories
    console.log('📋 Проверяю расположение таблицы subcategories...');
    const schemaQueries = [
      "SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'subcategories'",
      "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'subcategories'",
      "SELECT n.nspname as schema, c.relname as table FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE c.relname = 'subcategories'"
    ];

    for (const query of schemaQueries) {
      try {
        const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: query }),
        });
        const result = await response.json();
        if (result.success) {
          console.log(`✅ ${query.substring(0, 50)}...`);
          console.log(`   Результат:`, result.results);
        } else {
          console.log(`❌ ${query.substring(0, 50)}...`);
          console.log(`   Ошибка:`, result.error);
        }
      } catch (error) {
        console.log(`❌ Ошибка выполнения ${query.substring(0, 50)}...: ${error.message}`);
      }
    }

    // 2. Проверяем права доступа
    console.log('\n🔐 Проверяю права доступа...');
    const permissionQueries = [
      "SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'subcategories'",
      "SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'categories'"
    ];

    for (const query of permissionQueries) {
      try {
        const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: query }),
        });
        const result = await response.json();
        if (result.success) {
          console.log(`✅ ${query.substring(0, 50)}...`);
          console.log(`   Результат:`, result.results);
        } else {
          console.log(`❌ ${query.substring(0, 50)}...`);
          console.log(`   Ошибка:`, result.error);
        }
      } catch (error) {
        console.log(`❌ Ошибка выполнения ${query.substring(0, 50)}...: ${error.message}`);
      }
    }

    // 3. Пересоздаем таблицу subcategories в правильной схеме
    console.log('\n🔄 Пересоздаю таблицу subcategories...');
    const recreateSQL = `
      BEGIN;
      
      -- Удаляем старую таблицу если она существует
      DROP TABLE IF EXISTS public.subcategories CASCADE;
      
      -- Создаем новую таблицу
      CREATE TABLE public.subcategories (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Создаем индексы
      CREATE INDEX idx_subcategories_category_id ON public.subcategories(category_id);
      CREATE INDEX idx_subcategories_name ON public.subcategories(name);
      
      -- Даем права доступа
      GRANT ALL ON public.subcategories TO anon;
      GRANT ALL ON public.subcategories TO authenticated;
      GRANT ALL ON public.subcategories TO service_role;
      GRANT USAGE, SELECT ON SEQUENCE public.subcategories_id_seq TO anon;
      GRANT USAGE, SELECT ON SEQUENCE public.subcategories_id_seq TO authenticated;
      GRANT USAGE, SELECT ON SEQUENCE public.subcategories_id_seq TO service_role;
      
      -- Отключаем RLS для разработки
      ALTER TABLE public.subcategories DISABLE ROW LEVEL SECURITY;
      
      COMMIT;
      
      -- Уведомляем PostgREST
      NOTIFY pgrst, 'reload schema';
      SELECT pg_notify('pgrst', 'reload schema');
    `;

    try {
      const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: recreateSQL }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ Таблица subcategories пересоздана успешно!');
      } else {
        console.log('❌ Ошибка пересоздания таблицы:', result.error);
      }
    } catch (error) {
      console.log('❌ Ошибка выполнения SQL:', error.message);
    }

    // 4. Ждем и проверяем
    console.log('\n⏳ Жду 5 секунд...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5. Проверяем доступность
    console.log('\n🔍 Проверяю доступность subcategories...');
    const { data: subcategories, error: subError } = await supabase
      .from('subcategories')
      .select('*')
      .limit(1);
    
    if (subError) {
      console.log(`❌ Subcategories все еще недоступны: ${subError.message}`);
    } else {
      console.log(`✅ Subcategories теперь доступны! Найдено: ${subcategories?.length || 0}`);
    }

    // 6. Добавляем тестовые данные
    console.log('\n📝 Добавляю тестовые данные...');
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);
    
    if (categories && categories.length > 0) {
      const categoryId = categories[0].id;
      const { data: insertResult, error: insertError } = await supabase
        .from('subcategories')
        .insert([
          { category_id: categoryId, name: 'Test Subcategory 1' },
          { category_id: categoryId, name: 'Test Subcategory 2' }
        ])
        .select();
      
      if (insertError) {
        console.log(`❌ Ошибка вставки тестовых данных: ${insertError.message}`);
      } else {
        console.log(`✅ Тестовые данные добавлены: ${insertResult?.length || 0} записей`);
      }
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

fixSubcategoriesSchema();
