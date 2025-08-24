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

async function removeSortOrderColumns() {
  console.log('🔧 Удаляю колонку sort_order из таблиц...');
  
  try {
    // SQL миграция для удаления колонок
    const sql = `
      BEGIN;

      -- Удаляем колонку sort_order из categories
      ALTER TABLE public.categories DROP COLUMN IF EXISTS sort_order;

      -- Удаляем колонку sort_order из subcategories
      ALTER TABLE public.subcategories DROP COLUMN IF EXISTS sort_order;

      -- Удаляем индекс если есть
      DROP INDEX IF EXISTS idx_categories_sort_order;

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
      console.log('✅ Колонки sort_order удалены!');
      console.log('📊 Результаты:', result.results);
    } else {
      console.error('❌ Ошибка удаления колонок:', result);
      return;
    }

    // Тестируем вставку без sort_order
    console.log('\n📝 Тестирую вставку без sort_order...');
    const { data: testCategory, error: testError } = await supabase
      .from('categories')
      .insert({
        name: 'Test Category No SortOrder',
        slug: 'test-no-sort-' + Date.now(),
      })
      .select()
      .single();

    if (testError) {
      console.error('❌ Тест не прошел:', testError);
    } else {
      console.log('✅ Тест прошел! Категория создана:', testCategory);
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

removeSortOrderColumns();
