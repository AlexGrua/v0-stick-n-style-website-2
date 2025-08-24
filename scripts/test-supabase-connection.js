// Тестирование подключения к Supabase
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

async function testSupabaseConnection() {
  console.log('🔍 Тестируем подключение к Supabase...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Отсутствуют переменные окружения:');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
    return;
  }

  console.log('✅ Переменные окружения найдены');
  console.log('URL:', supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Тест подключения
    console.log('\n1. Тестируем подключение...');
    const { data: testData, error: testError } = await supabase
      .from('suppliers')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Ошибка подключения:', testError);
      return;
    }

    console.log('✅ Подключение успешно');

    // 2. Проверяем таблицу suppliers
    console.log('\n2. Проверяем таблицу suppliers...');
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .limit(5);

    if (suppliersError) {
      console.error('❌ Ошибка получения suppliers:', suppliersError);
      return;
    }

    console.log('✅ Suppliers получены:', suppliers?.length || 0);
    if (suppliers && suppliers.length > 0) {
      console.log('   Примеры:', suppliers.slice(0, 2).map(s => ({
        id: s.id,
        name: s.name,
        code: s.code
      })));
    }

    // 3. Проверяем структуру таблицы
    console.log('\n3. Проверяем структуру таблицы suppliers...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'suppliers' });

    if (columnsError) {
      console.log('⚠️ Не удалось получить структуру через RPC, используем альтернативный способ...');
      
      // Альтернативный способ - просто попробуем получить одну запись
      const { data: sample, error: sampleError } = await supabase
        .from('suppliers')
        .select('*')
        .limit(1)
        .single();

      if (sampleError) {
        console.error('❌ Ошибка получения структуры:', sampleError);
        return;
      }

      console.log('✅ Структура таблицы (из примера):', Object.keys(sample || {}));
    } else {
      console.log('✅ Структура таблицы:', columns);
    }

    // 4. Тест создания записи
    console.log('\n4. Тестируем создание записи...');
    const testSupplier = {
      name: 'Test Supplier ' + Date.now(),
      email: 'test@example.com',
      contact_person: 'Test Person',
      status: 'active'
    };

    const { data: newSupplier, error: createError } = await supabase
      .from('suppliers')
      .insert(testSupplier)
      .select()
      .single();

    if (createError) {
      console.error('❌ Ошибка создания:', createError);
    } else {
      console.log('✅ Запись создана:', newSupplier.id);
      
      // Удаляем тестовую запись
      await supabase
        .from('suppliers')
        .delete()
        .eq('id', newSupplier.id);
      console.log('✅ Тестовая запись удалена');
    }

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }

  console.log('\n🏁 Тестирование завершено!');
}

testSupabaseConnection();
