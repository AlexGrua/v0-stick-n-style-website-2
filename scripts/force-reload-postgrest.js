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

async function forceReloadPostgREST() {
  console.log('🔄 Принудительная перезагрузка PostgREST кеша...\n');

  try {
    // 1. Выполняем NOTIFY команды
    console.log('📢 Отправляю NOTIFY команды...');
    const notifyCommands = [
      "NOTIFY pgrst, 'reload schema';",
      "SELECT pg_notify('pgrst', 'reload schema');",
      "SELECT pg_notify('pgrst','reload schema');",
      "SELECT pg_reload_conf();"
    ];

    for (const command of notifyCommands) {
      try {
        const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: command }),
        });
        const result = await response.json();
        if (result.success) {
          console.log(`✅ ${command}`);
        } else {
          console.log(`❌ ${command}: ${result.error}`);
        }
      } catch (error) {
        console.log(`❌ Ошибка выполнения ${command}: ${error.message}`);
      }
    }

    // 2. Ждем немного
    console.log('\n⏳ Жду 10 секунд для применения изменений...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 3. Проверяем, работает ли теперь subcategories
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

    // 4. Проверяем API endpoints
    console.log('\n🌐 Проверяю API endpoints...');
    const endpoints = [
      'http://localhost:3000/api/categories',
      'http://localhost:3000/api/subcategories',
      'http://localhost:3000/api/products'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        console.log(`✅ ${endpoint}: ${response.status} - ${data.items?.length || data.length || 0} записей`);
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }

    // 5. Проверяем связи между таблицами
    console.log('\n🔗 Проверяю связи между таблицами...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);
    
    if (!catError && categories && categories.length > 0) {
      const categoryId = categories[0].id;
      const { data: relatedSubs, error: relError } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId);
      
      if (relError) {
        console.log(`❌ Связи не работают: ${relError.message}`);
      } else {
        console.log(`✅ Связи работают! Subcategories для категории ${categoryId}: ${relatedSubs?.length || 0}`);
      }
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

forceReloadPostgREST();
