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

async function testDbInsert() {
  console.log('🧪 Тестирую вставку категории в БД...');
  console.log('🔗 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('🔑 Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Есть' : 'НЕТ!');
  
  try {
    // Тест 1: Простая вставка
    console.log('📝 Тест 1: Вставка категории...');
    const { data, error } = await supabase
      .from('categories')
      .insert({ 
        name: 'Test Category', 
        slug: 'test-category-' + Date.now() 
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка вставки:', error);
      return;
    }

    console.log('✅ Вставка успешна:', data);

    // Тест 2: Проверяем структуру таблицы
    console.log('\n📝 Тест 2: Проверяем структуру таблицы...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'categories')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Ошибка получения структуры:', columnsError);
    } else {
      console.log('📊 Структура таблицы categories:');
      columns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
    }

    // Тест 3: Проверяем RLS
    console.log('\n📝 Тест 3: Проверяем RLS...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('tablename', 'categories')
      .single();

    if (rlsError) {
      console.error('❌ Ошибка проверки RLS:', rlsError);
    } else {
      console.log(`🔒 RLS статус: ${rlsStatus.rowsecurity ? 'ВКЛЮЧЕН' : 'ОТКЛЮЧЕН'}`);
    }

    // Тест 4: Проверяем существующие данные
    console.log('\n📝 Тест 4: Проверяем существующие категории...');
    const { data: existing, error: existingError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    if (existingError) {
      console.error('❌ Ошибка получения данных:', existingError);
    } else {
      console.log(`📊 Найдено категорий: ${existing.length}`);
      existing.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug})`);
      });
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

testDbInsert();
