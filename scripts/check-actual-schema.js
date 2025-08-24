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

async function checkActualSchema() {
  console.log('🔍 Проверяю реальную структуру данных...\n');

  try {
    // 1. Проверяем таблицы
    console.log('📋 Проверяю существующие таблицы...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['categories', 'products', 'suppliers', 'subcategories']);

    if (tablesError) {
      console.log(`❌ Ошибка проверки таблиц: ${tablesError.message}`);
    } else {
      console.log('✅ Существующие таблицы:', tables?.map(t => t.table_name) || []);
    }

    // 2. Проверяем структуру categories
    console.log('\n📋 Проверяю структуру categories...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(3);

    if (catError) {
      console.log(`❌ Ошибка чтения categories: ${catError.message}`);
    } else {
      console.log(`✅ Categories: ${categories?.length || 0} записей`);
      if (categories && categories.length > 0) {
        console.log('📋 Колонки categories:', Object.keys(categories[0]));
        console.log('📋 Пример subs:', categories[0].subs);
      }
    }

    // 3. Проверяем структуру products
    console.log('\n📋 Проверяю структуру products...');
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .limit(3);

    if (prodError) {
      console.log(`❌ Ошибка чтения products: ${prodError.message}`);
    } else {
      console.log(`✅ Products: ${products?.length || 0} записей`);
      if (products && products.length > 0) {
        console.log('📋 Колонки products:', Object.keys(products[0]));
        console.log('📋 Пример specifications:', products[0].specifications);
        
        // Проверяем данные в specifications
        const specs = products[0].specifications;
        if (specs) {
          console.log('📋 Данные в specifications:');
          console.log('  - sku:', specs.sku);
          console.log('  - supplier id:', specs['supplier id']);
          console.log('  - subs:', specs.subs);
        }
      }
    }

    // 4. Проверяем структуру suppliers
    console.log('\n📋 Проверяю структуру suppliers...');
    const { data: suppliers, error: suppError } = await supabase
      .from('suppliers')
      .select('*')
      .limit(3);

    if (suppError) {
      console.log(`❌ Ошибка чтения suppliers: ${suppError.message}`);
    } else {
      console.log(`✅ Suppliers: ${suppliers?.length || 0} записей`);
      if (suppliers && suppliers.length > 0) {
        console.log('📋 Колонки suppliers:', Object.keys(suppliers[0]));
      }
    }

    // 5. Проверяем subcategories таблицу
    console.log('\n📋 Проверяю subcategories таблицу...');
    const { data: subcategories, error: subError } = await supabase
      .from('subcategories')
      .select('*')
      .limit(3);

    if (subError) {
      console.log(`❌ Таблица subcategories не существует: ${subError.message}`);
    } else {
      console.log(`✅ Subcategories: ${subcategories?.length || 0} записей`);
      if (subcategories && subcategories.length > 0) {
        console.log('📋 Колонки subcategories:', Object.keys(subcategories[0]));
      }
    }

    console.log('\n🎉 Проверка завершена!');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

checkActualSchema();
