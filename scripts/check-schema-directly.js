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

async function checkSchemaDirectly() {
  console.log('🔍 Прямая проверка схемы в Supabase...\n');

  try {
    // 1. Проверяем таблицы через SQL
    console.log('📋 Проверяю таблицы через SQL...');
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('products', 'categories', 'subcategories', 'suppliers')
          ORDER BY table_name;
        `
      });

    if (tablesError) {
      console.log(`❌ Ошибка проверки таблиц: ${tablesError.message}`);
    } else {
      console.log('✅ Найденные таблицы:', tables);
    }

    // 2. Проверяем колонки products
    console.log('\n🔍 Проверяю колонки products...');
    
    const { data: productColumns, error: productColumnsError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'products'
          ORDER BY ordinal_position;
        `
      });

    if (productColumnsError) {
      console.log(`❌ Ошибка проверки колонок products: ${productColumnsError.message}`);
    } else {
      console.log('✅ Колонки products:');
      productColumns?.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 3. Проверяем колонки suppliers
    console.log('\n🔍 Проверяю колонки suppliers...');
    
    const { data: supplierColumns, error: supplierColumnsError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'suppliers'
          ORDER BY ordinal_position;
        `
      });

    if (supplierColumnsError) {
      console.log(`❌ Ошибка проверки колонок suppliers: ${supplierColumnsError.message}`);
    } else {
      console.log('✅ Колонки suppliers:');
      supplierColumns?.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 4. Проверяем данные
    console.log('\n📊 Проверяю данные...');
    
    // Categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .limit(3);
    
    if (catError) {
      console.log(`❌ Ошибка чтения categories: ${catError.message}`);
    } else {
      console.log(`✅ Categories: ${categories?.length || 0} записей`);
      categories?.forEach(cat => {
        console.log(`   - ${cat.name} (ID: ${cat.id}, slug: ${cat.slug})`);
      });
    }

    // Products
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name')
      .limit(3);
    
    if (prodError) {
      console.log(`❌ Ошибка чтения products: ${prodError.message}`);
    } else {
      console.log(`✅ Products: ${products?.length || 0} записей`);
      products?.forEach(prod => {
        console.log(`   - ${prod.name} (ID: ${prod.id})`);
      });
    }

    // 5. Тестируем создание записи
    console.log('\n🧪 Тестирую создание записи...');
    
    if (categories && categories.length > 0) {
      const testProduct = {
        name: `Test Product ${Date.now()}`,
        category_id: categories[0].id,
        specifications: {
          status: 'inactive',
          test: true
        }
      };

      const { data: createdProduct, error: createError } = await supabase
        .from('products')
        .insert(testProduct)
        .select()
        .single();

      if (createError) {
        console.log(`❌ Ошибка создания продукта: ${createError.message}`);
      } else {
        console.log(`✅ Продукт создан: ${createdProduct.name} (ID: ${createdProduct.id})`);
        
        // Удаляем тестовый продукт
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', createdProduct.id);
        
        if (deleteError) {
          console.log(`⚠️ Ошибка удаления: ${deleteError.message}`);
        } else {
          console.log('✅ Тестовый продукт удален');
        }
      }
    }

    console.log('\n🎉 Проверка завершена!');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

checkSchemaDirectly();
