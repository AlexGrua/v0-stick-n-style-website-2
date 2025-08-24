const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Загружаем переменные окружения из .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
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

// Используем service role key для прямого доступа к БД
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addCategoriesColumns() {
  console.log('🔧 Добавляю колонки в таблицу categories...');
  
  try {
    // SQL миграция для добавления колонок
    const sql = `
      BEGIN;

      ALTER TABLE public.categories
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

      -- Создаем индекс для сортировки
      CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

      COMMIT;

      -- Обновляем кеш PostgREST
      NOTIFY pgrst, 'reload schema';
      SELECT pg_notify('pgrst','reload schema');
    `;

    console.log('📝 Выполняю SQL миграцию...');

    // Выполняем через наш API
    const response = await fetch('http://localhost:3001/api/migrations/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Колонки добавлены!');
      console.log('📊 Результаты:', result.results);
    } else {
      console.error('❌ Ошибка добавления колонок:', result);
      return;
    }

    // Проверяем структуру таблицы
    console.log('\n📝 Проверяю структуру таблицы...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'categories')
      .in('column_name', ['is_active', 'sort_order'])
      .order('column_name');

    if (columnsError) {
      console.error('❌ Ошибка проверки структуры:', columnsError);
    } else {
      console.log('📊 Найденные колонки:');
      columns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
    }

    // Тестируем вставку с новыми колонками
    console.log('\n📝 Тестирую вставку с новыми колонками...');
    const { data: testCategory, error: testError } = await supabase
      .from('categories')
      .insert({
        name: 'Test Category with Columns',
        slug: 'test-cols-' + Date.now(),
        is_active: true,
        sort_order: 10
      })
      .select()
      .single();

    if (testError) {
      console.error('❌ Тест не прошел:', testError);
    } else {
      console.log('✅ Тест прошел! Категория создана:', testCategory);
    }

    // Проверяем схему
    console.log('\n📝 Проверяю схему...');
    const { data: schemaCheck, error: schemaError } = await supabase
      .rpc('to_regclass', { class_name: 'public.categories' });

    if (schemaError) {
      console.error('❌ Ошибка проверки схемы:', schemaError);
    } else {
      console.log('✅ Схема проверена:', schemaCheck);
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

addCategoriesColumns();
