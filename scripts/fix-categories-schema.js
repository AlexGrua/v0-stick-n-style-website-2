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

async function fixCategoriesSchema() {
  console.log('🔧 Исправляю схему таблицы categories...');
  
  try {
    // Добавляем недостающие колонки в categories
    const sql = `
      -- Добавляем недостающие колонки в categories
      ALTER TABLE IF EXISTS categories 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

      -- Обновляем существующие записи
      UPDATE categories SET is_active = true WHERE is_active IS NULL;
      UPDATE categories SET sort_order = 0 WHERE sort_order IS NULL;

      -- Обновляем кеш PostgREST
      NOTIFY pgrst, 'reload schema';
    `;

    console.log('📝 Выполняю SQL:', sql);

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
      console.log('✅ Схема categories исправлена!');
      console.log('📊 Результаты:', result.results);
    } else {
      console.error('❌ Ошибка исправления схемы:', result);
    }

    // Проверяем результат
    console.log('\n📝 Проверяю исправленную схему...');
    const { data: testCategory, error: testError } = await supabase
      .from('categories')
      .insert({
        name: 'Test Fix Category',
        slug: 'test-fix-' + Date.now(),
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

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

fixCategoriesSchema();
