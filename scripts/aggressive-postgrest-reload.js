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

async function aggressivePostgrestReload() {
  console.log('🔥 Агрессивная перезагрузка PostgREST кеша...\n');

  try {
    // 1. Проверяем текущее состояние
    console.log('📋 Проверяю текущее состояние...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (productsError) {
      console.log(`❌ Ошибка чтения products: ${productsError.message}`);
    } else {
      console.log(`✅ Products доступны: ${products?.length || 0} записей`);
    }

    // 2. Проверяем subcategories
    const { data: subcategories, error: subError } = await supabase
      .from('subcategories')
      .select('*')
      .limit(1);

    if (subError) {
      console.log(`❌ Ошибка чтения subcategories: ${subError.message}`);
    } else {
      console.log(`✅ Subcategories доступны: ${subcategories?.length || 0} записей`);
    }

    // 3. Проверяем suppliers.code
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('id, name, code')
      .limit(1);

    if (suppliersError) {
      console.log(`❌ Ошибка чтения suppliers.code: ${suppliersError.message}`);
    } else {
      console.log(`✅ Suppliers.code доступен: ${suppliers?.length || 0} записей`);
    }

    // 4. Агрессивная перезагрузка PostgREST
    console.log('\n🔄 Агрессивная перезагрузка PostgREST...');
    
    // Метод 1: NOTIFY
    console.log('📢 Метод 1: NOTIFY pgrst...');
    try {
      await supabase.rpc('exec_sql', { sql: `NOTIFY pgrst, 'reload schema';` });
      console.log('✅ NOTIFY отправлен');
    } catch (e) {
      console.log(`❌ NOTIFY не сработал: ${e.message}`);
    }

    // Метод 2: pg_notify
    console.log('📢 Метод 2: pg_notify...');
    try {
      await supabase.rpc('exec_sql', { sql: `SELECT pg_notify('pgrst', 'reload schema');` });
      console.log('✅ pg_notify отправлен');
    } catch (e) {
      console.log(`❌ pg_notify не сработал: ${e.message}`);
    }

    // Метод 3: pg_reload_conf
    console.log('📢 Метод 3: pg_reload_conf...');
    try {
      await supabase.rpc('exec_sql', { sql: `SELECT pg_reload_conf();` });
      console.log('✅ pg_reload_conf выполнен');
    } catch (e) {
      console.log(`❌ pg_reload_conf не сработал: ${e.message}`);
    }

    // Метод 4: Принудительное обновление схемы
    console.log('📢 Метод 4: Принудительное обновление схемы...');
    try {
      await supabase.rpc('exec_sql', { sql: `
        DO $$
        BEGIN
          -- Принудительно обновляем информацию о схеме
          PERFORM pg_stat_clear_snapshot();
          PERFORM pg_stat_reset();
        END $$;
      ` });
      console.log('✅ Статистика схемы сброшена');
    } catch (e) {
      console.log(`❌ Сброс статистики не сработал: ${e.message}`);
    }

    // 5. Ждем и проверяем снова
    console.log('\n⏳ Жду 15 секунд для применения изменений...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // 6. Проверяем результат
    console.log('\n🔍 Проверяю результат после перезагрузки...');
    
    const { data: products2, error: productsError2 } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (productsError2) {
      console.log(`❌ Products все еще недоступны: ${productsError2.message}`);
    } else {
      console.log(`✅ Products доступны: ${products2?.length || 0} записей`);
      if (products2 && products2.length > 0) {
        console.log(`📋 Структура первой записи:`, Object.keys(products2[0]));
      }
    }

    const { data: subcategories2, error: subError2 } = await supabase
      .from('subcategories')
      .select('*')
      .limit(1);

    if (subError2) {
      console.log(`❌ Subcategories все еще недоступны: ${subError2.message}`);
    } else {
      console.log(`✅ Subcategories доступны: ${subcategories2?.length || 0} записей`);
    }

    const { data: suppliers2, error: suppliersError2 } = await supabase
      .from('suppliers')
      .select('id, name, code')
      .limit(1);

    if (suppliersError2) {
      console.log(`❌ Suppliers.code все еще недоступен: ${suppliersError2.message}`);
    } else {
      console.log(`✅ Suppliers.code доступен: ${suppliers2?.length || 0} записей`);
    }

    // 7. Тестируем создание продукта
    console.log('\n🧪 Тестирую создание продукта...');
    try {
      const testProduct = {
        name: 'Test Product for Schema',
        slug: 'test-product-schema-' + Date.now(),
        category_id: 8, // PET Panel
        supplier_id: 1,
        sku: 'TEST-SKU-' + Date.now(),
        specifications: { test: true }
      };

      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert(testProduct)
        .select()
        .single();

      if (createError) {
        console.log(`❌ Ошибка создания продукта: ${createError.message}`);
      } else {
        console.log(`✅ Продукт создан успешно: ${newProduct.name} (SKU: ${newProduct.sku})`);
        
        // Удаляем тестовый продукт
        await supabase.from('products').delete().eq('id', newProduct.id);
        console.log('✅ Тестовый продукт удален');
      }
    } catch (e) {
      console.log(`❌ Ошибка тестирования: ${e.message}`);
    }

    console.log('\n🎉 Агрессивная перезагрузка завершена!');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

aggressivePostgrestReload();
