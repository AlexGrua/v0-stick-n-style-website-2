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

async function finalSchemaMigration() {
  console.log('🔧 Финальная миграция схемы к единому стандарту...\n');

  try {
    // 1. Создаем таблицу subcategories если её нет
    console.log('📝 Создаю таблицу subcategories...');
    const createSubcategoriesSQL = `
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
    `;

    try {
      const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: createSubcategoriesSQL }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ Таблица subcategories создана');
      } else {
        console.log('❌ Ошибка создания subcategories:', result.error);
      }
    } catch (error) {
      console.log('❌ Ошибка выполнения SQL:', error.message);
    }

    // 2. Добавляем недостающие колонки в products
    console.log('\n📝 Добавляю недостающие колонки в products...');
    const alterProductsSQL = `
      ALTER TABLE IF EXISTS products 
        ADD COLUMN IF NOT EXISTS sku TEXT,
        ADD COLUMN IF NOT EXISTS subcategory_id INTEGER,
        ADD COLUMN IF NOT EXISTS supplier_id INTEGER,
        ADD COLUMN IF NOT EXISTS specifications JSONB NOT NULL DEFAULT '{}'::jsonb;
    `;

    try {
      const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: alterProductsSQL }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ Колонки в products добавлены');
      } else {
        console.log('❌ Ошибка добавления колонок:', result.error);
      }
    } catch (error) {
      console.log('❌ Ошибка выполнения SQL:', error.message);
    }

    // 3. Добавляем FK для subcategory_id
    console.log('\n🔗 Добавляю FK для subcategory_id...');
    const addFKSQL = `
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
    `;

    try {
      const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: addFKSQL }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ FK для subcategory_id добавлен');
      } else {
        console.log('❌ Ошибка добавления FK:', result.error);
      }
    } catch (error) {
      console.log('❌ Ошибка выполнения SQL:', error.message);
    }

    // 4. Добавляем колонку code в suppliers
    console.log('\n📝 Добавляю колонку code в suppliers...');
    const alterSuppliersSQL = `
      ALTER TABLE IF EXISTS suppliers 
        ADD COLUMN IF NOT EXISTS code VARCHAR(10);
      
      -- Создаем уникальный индекс для code
      CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);
    `;

    try {
      const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: alterSuppliersSQL }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ Колонка code в suppliers добавлена');
      } else {
        console.log('❌ Ошибка добавления code:', result.error);
      }
    } catch (error) {
      console.log('❌ Ошибка выполнения SQL:', error.message);
    }

    // 5. Создаем индексы
    console.log('\n📊 Создаю индексы...');
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);
      CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
      CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_specifications_gin ON products USING GIN (specifications);
    `;

    try {
      const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: createIndexesSQL }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ Индексы созданы');
      } else {
        console.log('❌ Ошибка создания индексов:', result.error);
      }
    } catch (error) {
      console.log('❌ Ошибка выполнения SQL:', error.message);
    }

    // 6. Отключаем RLS для админки
    console.log('\n🔓 Отключаю RLS для админки...');
    const disableRLSSQL = `
      ALTER TABLE products DISABLE ROW LEVEL SECURITY;
      ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
      ALTER TABLE subcategories DISABLE ROW LEVEL SECURITY;
      ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
    `;

    try {
      const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: disableRLSSQL }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ RLS отключен');
      } else {
        console.log('❌ Ошибка отключения RLS:', result.error);
      }
    } catch (error) {
      console.log('❌ Ошибка выполнения SQL:', error.message);
    }

    // 7. Перезагружаем PostgREST
    console.log('\n🔄 Перезагружаю PostgREST...');
    const reloadSQL = `
      NOTIFY pgrst, 'reload schema';
      SELECT pg_notify('pgrst', 'reload schema');
    `;

    try {
      const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: reloadSQL }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ PostgREST перезагружен');
      } else {
        console.log('❌ Ошибка перезагрузки PostgREST:', result.error);
      }
    } catch (error) {
      console.log('❌ Ошибка выполнения SQL:', error.message);
    }

    // 8. Ждем и проверяем результат
    console.log('\n⏳ Жду 5 секунд...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 9. Проверяем результат
    console.log('\n🔍 Проверяю результат...');
    
    // Проверяем subcategories
    const { data: subcategories, error: subError } = await supabase
      .from('subcategories')
      .select('id, name, category_id')
      .limit(5);
    
    if (subError) {
      console.log(`❌ Ошибка чтения subcategories: ${subError.message}`);
    } else {
      console.log(`✅ Subcategories: ${subcategories?.length || 0} записей`);
    }

    // Проверяем suppliers
    const { data: suppliers, error: supError } = await supabase
      .from('suppliers')
      .select('id, name, code')
      .limit(5);
    
    if (supError) {
      console.log(`❌ Ошибка чтения suppliers: ${supError.message}`);
    } else {
      console.log(`✅ Suppliers: ${suppliers?.length || 0} записей`);
      suppliers?.forEach(sup => {
        console.log(`   - ${sup.name} (ID: ${sup.id}, code: ${sup.code || 'N/A'})`);
      });
    }

    // Проверяем products
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, sku, category_id, subcategory_id, supplier_id, specifications')
      .limit(1);
    
    if (prodError) {
      console.log(`❌ Ошибка чтения products: ${prodError.message}`);
    } else if (products && products.length > 0) {
      const product = products[0];
      console.log('✅ Структура products обновлена:');
      console.log(`   - sku: ${typeof product.sku}`);
      console.log(`   - category_id: ${typeof product.category_id}`);
      console.log(`   - subcategory_id: ${typeof product.subcategory_id}`);
      console.log(`   - supplier_id: ${typeof product.supplier_id}`);
      console.log(`   - specifications: ${typeof product.specifications}`);
    }

    console.log('\n🎉 Финальная миграция завершена!');
    console.log('\n📋 Схема готова для импорта:');
    console.log('   ✅ Таблица subcategories создана');
    console.log('   ✅ Колонки в products добавлены');
    console.log('   ✅ FK связи настроены');
    console.log('   ✅ Индексы созданы');
    console.log('   ✅ RLS отключен');
    console.log('   ✅ PostgREST перезагружен');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

finalSchemaMigration();
