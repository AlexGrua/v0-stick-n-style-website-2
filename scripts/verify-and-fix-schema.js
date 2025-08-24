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

async function verifyAndFixSchema() {
  console.log('🔍 Проверка и исправление схемы...\n');

  try {
    // 1. Проверяем текущую структуру products
    console.log('📋 Проверяю структуру таблицы products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (productsError) {
      console.log(`❌ Ошибка чтения products: ${productsError.message}`);
      return;
    }

    let hasSku = false;
    let hasSubcategoryId = false;
    let hasSupplierId = false;
    let hasSpecifications = false;
    
    if (products && products.length > 0) {
      console.log('📋 Текущие колонки products:', Object.keys(products[0]));
      
      // Проверяем наличие нужных колонок
      hasSku = 'sku' in products[0];
      hasSubcategoryId = 'subcategory_id' in products[0];
      hasSupplierId = 'supplier_id' in products[0];
      hasSpecifications = 'specifications' in products[0];
      
      console.log(`✅ sku: ${hasSku ? 'ЕСТЬ' : 'ОТСУТСТВУЕТ'}`);
      console.log(`✅ subcategory_id: ${hasSubcategoryId ? 'ЕСТЬ' : 'ОТСУТСТВУЕТ'}`);
      console.log(`✅ supplier_id: ${hasSupplierId ? 'ЕСТЬ' : 'ОТСУТСТВУЕТ'}`);
      console.log(`✅ specifications: ${hasSpecifications ? 'ЕСТЬ' : 'ОТСУТСТВУЕТ'}`);
    }

    // 2. Проверяем subcategories таблицу
    console.log('\n📋 Проверяю таблицу subcategories...');
    const { data: subcategories, error: subError } = await supabase
      .from('subcategories')
      .select('*')
      .limit(1);

    if (subError) {
      console.log(`❌ Таблица subcategories не найдена: ${subError.message}`);
    } else {
      console.log(`✅ Таблица subcategories существует: ${subcategories?.length || 0} записей`);
    }

    // 3. Проверяем suppliers.code
    console.log('\n📋 Проверяю suppliers.code...');
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .limit(1);

    if (suppliersError) {
      console.log(`❌ Ошибка чтения suppliers: ${suppliersError.message}`);
    } else if (suppliers && suppliers.length > 0) {
      console.log('📋 Текущие колонки suppliers:', Object.keys(suppliers[0]));
      const hasCode = 'code' in suppliers[0];
      console.log(`✅ code: ${hasCode ? 'ЕСТЬ' : 'ОТСУТСТВУЕТ'}`);
    }

    // 4. Применяем недостающие изменения
    console.log('\n🔧 Применяю недостающие изменения схемы...');
    
    // Добавляем колонки в products если их нет
    if (!hasSku) {
      console.log('📝 Добавляю колонку sku в products...');
      try {
        await supabase.rpc('exec_sql', { sql: `
          ALTER TABLE public.products 
          ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;
        ` });
        console.log('✅ Колонка sku добавлена');
      } catch (e) {
        console.log(`❌ Ошибка добавления sku: ${e.message}`);
      }
    }

    if (!hasSubcategoryId) {
      console.log('📝 Добавляю колонку subcategory_id в products...');
      try {
        await supabase.rpc('exec_sql', { sql: `
          ALTER TABLE public.products 
          ADD COLUMN IF NOT EXISTS subcategory_id INTEGER REFERENCES public.subcategories(id);
        ` });
        console.log('✅ Колонка subcategory_id добавлена');
      } catch (e) {
        console.log(`❌ Ошибка добавления subcategory_id: ${e.message}`);
      }
    }

    if (!hasSupplierId) {
      console.log('📝 Добавляю колонку supplier_id в products...');
      try {
        await supabase.rpc('exec_sql', { sql: `
          ALTER TABLE public.products 
          ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES public.suppliers(id);
        ` });
        console.log('✅ Колонка supplier_id добавлена');
      } catch (e) {
        console.log(`❌ Ошибка добавления supplier_id: ${e.message}`);
      }
    }

    if (!hasSpecifications) {
      console.log('📝 Добавляю колонку specifications в products...');
      try {
        await supabase.rpc('exec_sql', { sql: `
          ALTER TABLE public.products 
          ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;
        ` });
        console.log('✅ Колонка specifications добавлена');
      } catch (e) {
        console.log(`❌ Ошибка добавления specifications: ${e.message}`);
      }
    }

    // Создаем subcategories таблицу если её нет
    if (subError) {
      console.log('📝 Создаю таблицу subcategories...');
      try {
        await supabase.rpc('exec_sql', { sql: `
          CREATE TABLE IF NOT EXISTS public.subcategories (
            id SERIAL PRIMARY KEY,
            category_id INTEGER NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            image_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        ` });
        console.log('✅ Таблица subcategories создана');
      } catch (e) {
        console.log(`❌ Ошибка создания subcategories: ${e.message}`);
      }
    }

    // Добавляем code в suppliers если его нет
    const { data: suppliers2, error: suppliersError2 } = await supabase
      .from('suppliers')
      .select('*')
      .limit(1);

    if (!suppliersError2 && suppliers2 && suppliers2.length > 0 && !('code' in suppliers2[0])) {
      console.log('📝 Добавляю колонку code в suppliers...');
      try {
        await supabase.rpc('exec_sql', { sql: `
          ALTER TABLE public.suppliers 
          ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;
        ` });
        console.log('✅ Колонка code добавлена в suppliers');
      } catch (e) {
        console.log(`❌ Ошибка добавления code: ${e.message}`);
      }
    }

    // 5. Создаем индексы
    console.log('\n📊 Создаю индексы...');
    try {
      await supabase.rpc('exec_sql', { sql: `
        CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
        CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
        CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products(subcategory_id);
        CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id);
        CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(code);
      ` });
      console.log('✅ Индексы созданы');
    } catch (e) {
      console.log(`❌ Ошибка создания индексов: ${e.message}`);
    }

    // 6. Перезагружаем PostgREST
    console.log('\n🔄 Перезагружаю PostgREST...');
    try {
      await supabase.rpc('exec_sql', { sql: `NOTIFY pgrst, 'reload schema';` });
      await supabase.rpc('exec_sql', { sql: `SELECT pg_notify('pgrst', 'reload schema');` });
      console.log('✅ PostgREST перезагружен');
    } catch (e) {
      console.log(`❌ Ошибка перезагрузки PostgREST: ${e.message}`);
    }

    // 7. Ждем и проверяем результат
    console.log('\n⏳ Жду 10 секунд...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('\n🔍 Проверяю результат...');
    const { data: productsFinal, error: productsFinalError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (productsFinalError) {
      console.log(`❌ Ошибка финальной проверки products: ${productsFinalError.message}`);
    } else if (productsFinal && productsFinal.length > 0) {
      console.log('📋 Финальные колонки products:', Object.keys(productsFinal[0]));
    }

    console.log('\n🎉 Проверка и исправление схемы завершено!');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

verifyAndFixSchema();
