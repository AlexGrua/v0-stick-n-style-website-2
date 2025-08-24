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

async function removeIsActiveColumns() {
  console.log('🔧 Удаляю колонку is_active из таблиц...');
  
  try {
    // SQL миграция для удаления колонок
    const sql = `
      BEGIN;

      -- Удаляем колонку is_active из categories
      ALTER TABLE public.categories DROP COLUMN IF EXISTS is_active;

      -- Удаляем колонку is_active из subcategories
      ALTER TABLE public.subcategories DROP COLUMN IF EXISTS is_active;

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
      console.log('✅ Колонки is_active удалены!');
      console.log('📊 Результаты:', result.results);
    } else {
      console.error('❌ Ошибка удаления колонок:', result);
      return;
    }

    // Тестируем вставку без is_active
    console.log('\n📝 Тестирую вставку без is_active...');
    const { data: testCategory, error: testError } = await supabase
      .from('categories')
      .insert({
        name: 'Test Category No IsActive',
        slug: 'test-no-active-' + Date.now(),
        sort_order: 10
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

removeIsActiveColumns();
