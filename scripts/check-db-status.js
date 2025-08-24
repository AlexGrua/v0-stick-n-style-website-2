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

async function checkDatabaseStatus() {
  console.log('🔍 Проверяю состояние базы данных...\n');

  try {
    // 1. Проверяем существование таблиц
    console.log('📋 Проверяю существование таблиц:');
    
    const tables = ['categories', 'subcategories', 'products', 'suppliers'];
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Таблица ${table}: ${error.message}`);
      } else {
        console.log(`✅ Таблица ${table}: существует, записей: ${data}`);
      }
    }

    console.log('\n📊 Проверяю структуру таблицы categories:');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(3);
    
    if (catError) {
      console.log(`❌ Ошибка получения categories: ${catError.message}`);
    } else {
      console.log(`✅ Categories найдено: ${categories?.length || 0}`);
      if (categories && categories.length > 0) {
        console.log('📝 Пример категории:', JSON.stringify(categories[0], null, 2));
      }
    }

    console.log('\n📊 Проверяю структуру таблицы subcategories:');
    const { data: subcategories, error: subError } = await supabase
      .from('subcategories')
      .select('*')
      .limit(3);
    
    if (subError) {
      console.log(`❌ Ошибка получения subcategories: ${subError.message}`);
    } else {
      console.log(`✅ Subcategories найдено: ${subcategories?.length || 0}`);
      if (subcategories && subcategories.length > 0) {
        console.log('📝 Пример subcategory:', JSON.stringify(subcategories[0], null, 2));
      }
    }

    // 2. Проверяем связи между таблицами
    console.log('\n🔗 Проверяю связи между таблицами:');
    if (categories && categories.length > 0 && subcategories && subcategories.length > 0) {
      const categoryId = categories[0].id;
      const { data: relatedSubs, error: relError } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId);
      
      if (relError) {
        console.log(`❌ Ошибка получения связанных subcategories: ${relError.message}`);
      } else {
        console.log(`✅ Subcategories для категории ${categoryId}: ${relatedSubs?.length || 0}`);
      }
    }

    // 3. Проверяем через SQL напрямую
    console.log('\n🔧 Проверяю через SQL запросы:');
    const sqlQueries = [
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'subcategories'",
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subcategories' ORDER BY ordinal_position",
      "SELECT COUNT(*) as count FROM subcategories",
      "SELECT c.name as category_name, COUNT(s.id) as sub_count FROM categories c LEFT JOIN subcategories s ON c.id = s.category_id GROUP BY c.id, c.name"
    ];

    for (const sql of sqlQueries) {
      try {
        const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql }),
        });
        const result = await response.json();
        if (result.success) {
          console.log(`✅ SQL: ${sql.substring(0, 50)}...`);
          console.log(`   Результат:`, result.results);
        } else {
          console.log(`❌ SQL: ${sql.substring(0, 50)}...`);
          console.log(`   Ошибка:`, result.error);
        }
      } catch (error) {
        console.log(`❌ Ошибка выполнения SQL: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

checkDatabaseStatus();
