require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Проверяем схему базы данных...\n');

    // 1. Проверяем search_path
    const { data: searchPath } = await supabase.rpc('exec_sql', { 
      sql: 'SHOW search_path;' 
    });
    console.log('1. Search path:', searchPath);

    // 2. Текущая база, пользователь, схема
    const { data: currentInfo } = await supabase.rpc('exec_sql', { 
      sql: 'SELECT current_database(), current_user, current_schema();' 
    });
    console.log('2. Current info:', currentInfo);

    // 3. Информация о таблицах
    const { data: tables } = await supabase.rpc('exec_sql', { 
      sql: `SELECT n.nspname AS schema, c.relname AS table, c.oid
            FROM pg_class c 
            JOIN pg_namespace n ON n.oid=c.relnamespace 
            WHERE c.relname IN ('categories','subcategories');` 
    });
    console.log('3. Tables info:', tables);

    // 4. Последние подкатегории
    const { data: subcategories } = await supabase.rpc('exec_sql', { 
      sql: 'SELECT id, name, slug, category_id, created_at FROM subcategories ORDER BY id DESC LIMIT 10;' 
    });
    console.log('4. Recent subcategories:', subcategories);

    // 5. Структура таблицы subcategories
    const { data: subcategoriesStructure } = await supabase.rpc('exec_sql', { 
      sql: `SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'subcategories' 
            ORDER BY ordinal_position;` 
    });
    console.log('5. Subcategories table structure:', subcategoriesStructure);

    // 6. Проверяем последние категории
    const { data: recentCategories } = await supabase.rpc('exec_sql', { 
      sql: 'SELECT id, name, slug, created_at FROM categories ORDER BY id DESC LIMIT 5;' 
    });
    console.log('6. Recent categories:', recentCategories);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabaseSchema();
