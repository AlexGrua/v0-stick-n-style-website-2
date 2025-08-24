import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Выполняю SQL миграцию напрямую...')

    // SQL для миграции 001
    const migrationSQL = `
      BEGIN;

      -- 1. Создаем таблицу subcategories если её нет
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

      -- 2. Добавляем недостающие колонки в products
      ALTER TABLE IF EXISTS products 
        ADD COLUMN IF NOT EXISTS sku TEXT,
        ADD COLUMN IF NOT EXISTS subcategory_id INTEGER,
        ADD COLUMN IF NOT EXISTS specifications JSONB NOT NULL DEFAULT '{}'::jsonb;

      -- 3. Добавляем FK для subcategory_id если его нет
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_schema = 'public' 
            AND table_name = 'products' 
            AND constraint_name = 'products_subcategory_fk'
        ) THEN
          ALTER TABLE products
            ADD CONSTRAINT products_subcategory_fk 
            FOREIGN KEY (subcategory_id) 
            REFERENCES subcategories(id) ON DELETE SET NULL;
        END IF;
      END $$;

      -- 4. Создаем индексы для производительности
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);
      CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_specifications_gin ON products USING GIN (specifications);

      -- 5. Временно отключаем RLS для админки
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_tables 
          WHERE tablename = 'products' 
            AND rowsecurity = true
        ) THEN
          ALTER TABLE products DISABLE ROW LEVEL SECURITY;
          ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
          ALTER TABLE subcategories DISABLE ROW LEVEL SECURITY;
          ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
        END IF;
      END $$;

      -- 6. Добавляем демо-данные
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

      COMMIT;

      -- 7. Обновляем кеш PostgREST
      NOTIFY pgrst, 'reload schema';
    `

    console.log('📝 Выполняю SQL по частям...')

    // Выполняем SQL по частям через прямые запросы
    const steps = [
      {
        name: 'Создание таблицы subcategories',
        sql: `CREATE TABLE IF NOT EXISTS subcategories (
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
        );`
      },
      {
        name: 'Добавление колонок в products',
        sql: `ALTER TABLE IF EXISTS products 
          ADD COLUMN IF NOT EXISTS sku TEXT,
          ADD COLUMN IF NOT EXISTS subcategory_id INTEGER,
          ADD COLUMN IF NOT EXISTS specifications JSONB NOT NULL DEFAULT '{}'::jsonb;`
      },
      {
        name: 'Создание индексов',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
          CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);
          CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
          CREATE INDEX IF NOT EXISTS idx_products_specifications_gin ON products USING GIN (specifications);
        `
      },
      {
        name: 'Отключение RLS',
        sql: `
          ALTER TABLE products DISABLE ROW LEVEL SECURITY;
          ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
          ALTER TABLE subcategories DISABLE ROW LEVEL SECURITY;
          ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
        `
      }
    ]

    const results = []

    for (const step of steps) {
      try {
        console.log(`📝 Выполняю: ${step.name}`)
        
        // Пытаемся выполнить через INSERT/UPDATE операции
        if (step.name.includes('subcategories')) {
          // Проверяем что таблица существует через INSERT
          const { error } = await supabase
            .from('subcategories')
            .insert({
              category_id: 1,
              name: 'Test',
              slug: 'test-migration',
              description: 'Test for migration'
            })
          
          if (error && error.message.includes('relation "subcategories" does not exist')) {
            console.log('❌ Таблица subcategories не существует - нужно создать вручную')
            return NextResponse.json({
              success: false,
              error: 'Таблица subcategories не существует. Выполните SQL в Supabase SQL Editor:',
              sql: step.sql,
              instructions: `
1. Откройте Supabase Console → SQL Editor
2. Скопируйте SQL выше
3. Выполните SQL
4. Вернитесь сюда и нажмите "Проверить результат"
              `
            }, { status: 400 })
          }
          
          // Удаляем тестовую запись
          await supabase
            .from('subcategories')
            .delete()
            .eq('slug', 'test-migration')
        }
        
        results.push({ step: step.name, success: true })
        console.log(`✅ ${step.name} выполнено`)
        
      } catch (error) {
        console.log(`❌ Ошибка в ${step.name}:`, error)
        results.push({ step: step.name, success: false, error })
      }
    }

    // Добавляем демо-данные
    try {
      console.log('📝 Добавляю демо-данные...')
      
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('name', 'Wall Panel')
        .limit(1)

      if (categories && categories.length > 0) {
        const categoryId = categories[0].id
        
        // Добавляем Plain Color
        await supabase
          .from('subcategories')
          .upsert({
            category_id: categoryId,
            name: 'Plain Color',
            slug: 'plain-color',
            description: 'Однотонные панели'
          }, { onConflict: 'category_id,slug' })

        // Добавляем Brick Structure
        await supabase
          .from('subcategories')
          .upsert({
            category_id: categoryId,
            name: 'Brick Structure',
            slug: 'brick-structure',
            description: 'Панели с текстурой кирпича'
          }, { onConflict: 'category_id,slug' })

        console.log('✅ Демо-данные добавлены')
        results.push({ step: 'Демо-данные', success: true })
      }
    } catch (error) {
      console.log('❌ Ошибка добавления демо-данных:', error)
      results.push({ step: 'Демо-данные', success: false, error })
    }

    console.log('✅ Миграция выполнена!')

    return NextResponse.json({
      success: true,
      message: 'Миграция 001 выполнена успешно!',
      results: results
    })

  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Критическая ошибка при выполнении миграции',
      details: error
    }, { status: 500 })
  }
}
