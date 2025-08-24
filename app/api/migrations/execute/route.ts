import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Начинаю выполнение миграции 001...')

    const results = []

    // 1. Проверяем текущее состояние
    console.log('📝 Проверяю текущее состояние...')
    
    // Проверяем колонки products
    const { data: currentColumns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'products')
      .in('column_name', ['sku', 'subcategory_id', 'specifications'])

    console.log('Текущие колонки products:', currentColumns)

    // Проверяем таблицу subcategories
    const { data: currentTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_name', 'subcategories')

    console.log('Текущие таблицы:', currentTables)

    // 2. Пытаемся создать таблицу subcategories через INSERT
    console.log('📝 2. Создаю таблицу subcategories...')
    
    // Сначала попробуем создать через INSERT (если таблица не существует, получим ошибку)
    const { error: insertError } = await supabase
      .from('subcategories')
      .insert({
        category_id: 1, // временный ID
        name: 'Test',
        slug: 'test',
        description: 'Test subcategory'
      })

    if (insertError && insertError.message.includes('relation "subcategories" does not exist')) {
      console.log('❌ Таблица subcategories не существует - нужно создать вручную')
      return NextResponse.json({
        success: false,
        error: 'Таблица subcategories не существует. Выполните SQL в Supabase SQL Editor:',
        sql: `
-- Создайте таблицу subcategories вручную в Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Добавьте колонки в products:

ALTER TABLE IF EXISTS products 
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS subcategory_id INTEGER,
  ADD COLUMN IF NOT EXISTS specifications JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Добавьте FK связь:

ALTER TABLE products
  ADD CONSTRAINT IF NOT EXISTS products_subcategory_fk 
  FOREIGN KEY (subcategory_id) 
  REFERENCES subcategories(id) ON DELETE SET NULL;

-- Создайте индексы:

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_products_specifications_gin ON products USING GIN (specifications);

-- Отключите RLS:

ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;

-- Добавьте демо-данные:

INSERT INTO subcategories (category_id, name, slug, description) 
SELECT 
  c.id,
  'Plain Color',
  'plain-color',
  'Однотонные панели'
FROM categories c 
WHERE c.name = 'Wall Panel' 
  AND NOT EXISTS (
    SELECT 1 FROM subcategories sc 
    WHERE sc.category_id = c.id AND sc.name = 'Plain Color'
  );

INSERT INTO subcategories (category_id, name, slug, description) 
SELECT 
  c.id,
  'Brick Structure',
  'brick-structure',
  'Панели с текстурой кирпича'
FROM categories c 
WHERE c.name = 'Wall Panel' 
  AND NOT EXISTS (
    SELECT 1 FROM subcategories sc 
    WHERE sc.category_id = c.id AND sc.name = 'Brick Structure'
  );

-- Обновите кеш PostgREST:

NOTIFY pgrst, 'reload schema';
        `,
        instructions: `
1. Откройте Supabase Console → SQL Editor
2. Скопируйте SQL выше
3. Выполните SQL
4. Вернитесь сюда и нажмите "Проверить результат"
        `
      }, { status: 400 })
    }

    // Если таблица существует, удаляем тестовую запись
    if (!insertError) {
      await supabase
        .from('subcategories')
        .delete()
        .eq('slug', 'test')
    }

    console.log('✅ Таблица subcategories существует')

    // 3. Проверяем колонки products
    console.log('📝 3. Проверяю колонки products...')
    
    if (!currentColumns || currentColumns.length === 0) {
      console.log('❌ Колонки не найдены - нужно добавить вручную')
      return NextResponse.json({
        success: false,
        error: 'Колонки sku, subcategory_id, specifications не найдены в таблице products. Выполните SQL в Supabase SQL Editor:',
        sql: `
-- Добавьте колонки в products:

ALTER TABLE IF EXISTS products 
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS subcategory_id INTEGER,
  ADD COLUMN IF NOT EXISTS specifications JSONB NOT NULL DEFAULT '{}'::jsonb;
        `,
        instructions: `
1. Откройте Supabase Console → SQL Editor
2. Скопируйте SQL выше
3. Выполните SQL
4. Вернитесь сюда и нажмите "Проверить результат"
        `
      }, { status: 400 })
    }

    console.log('✅ Колонки products существуют')

    // 4. Проверяем демо-данные
    console.log('📝 4. Проверяю демо-данные...')
    
    const { data: demoData, error: demoError } = await supabase
      .from('subcategories')
      .select(`
        id,
        name,
        slug,
        categories!inner(name)
      `)
      .limit(5)

    if (demoError) {
      console.log('❌ Ошибка получения демо-данных:', demoError)
    } else {
      console.log('✅ Демо-данные найдены:', demoData)
    }

    // 5. Проверяем API endpoints
    console.log('📝 5. Проверяю API endpoints...')
    
    // Проверяем /api/categories
    try {
      const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/categories?select=*&limit=1`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      })
      
      if (categoriesResponse.ok) {
        console.log('✅ API categories работает')
      } else {
        console.log('❌ API categories не работает:', categoriesResponse.status)
      }
    } catch (e) {
      console.log('❌ Ошибка проверки API categories:', e)
    }

    console.log('✅ Миграция проверена!')

    return NextResponse.json({
      success: true,
      message: 'Миграция 001 проверена успешно!',
              verification: {
          columns: currentColumns,
          tables: currentTables,
          demoData: demoData,
          columnsError: columnsError,
          tablesError: tablesError,
          demoError: demoError
        }
    })

  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Критическая ошибка при проверке миграции',
      details: error
    }, { status: 500 })
  }
}
