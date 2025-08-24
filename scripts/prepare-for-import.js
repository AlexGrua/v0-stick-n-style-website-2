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

async function prepareForImport() {
  console.log('🔧 Подготовка схемы к импорту продуктов...\n');

  try {
    // 1. Проверяем существование таблиц
    console.log('📋 Проверяю существование таблиц...');
    
    const tables = ['products', 'categories', 'subcategories', 'suppliers'];
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`❌ Таблица ${table} не найдена: ${error.message}`);
      } else {
        console.log(`✅ Таблица ${table} существует`);
      }
    }

    // 2. Проверяем структуру products
    console.log('\n🔍 Проверяю структуру таблицы products...');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (productsError) {
      console.log(`❌ Ошибка чтения products: ${productsError.message}`);
    } else if (products && products.length > 0) {
      const product = products[0];
      console.log('✅ Структура products:');
      console.log(`   - id: ${typeof product.id}`);
      console.log(`   - sku: ${typeof product.sku}`);
      console.log(`   - category_id: ${typeof product.category_id}`);
      console.log(`   - subcategory_id: ${typeof product.subcategory_id}`);
      console.log(`   - supplier_id: ${typeof product.supplier_id}`);
      console.log(`   - specifications: ${typeof product.specifications}`);
    }

    // 3. Проверяем FK связи
    console.log('\n🔗 Проверяю FK связи...');
    
    // Проверяем categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .limit(5);
    
    if (catError) {
      console.log(`❌ Ошибка чтения categories: ${catError.message}`);
    } else {
      console.log(`✅ Categories: ${categories?.length || 0} записей`);
      categories?.forEach(cat => {
        console.log(`   - ${cat.name} (ID: ${cat.id}, slug: ${cat.slug})`);
      });
    }

    // Проверяем subcategories
    const { data: subcategories, error: subError } = await supabase
      .from('subcategories')
      .select('id, name, slug, category_id')
      .limit(5);
    
    if (subError) {
      console.log(`❌ Ошибка чтения subcategories: ${subError.message}`);
    } else {
      console.log(`✅ Subcategories: ${subcategories?.length || 0} записей`);
      subcategories?.forEach(sub => {
        console.log(`   - ${sub.name} (ID: ${sub.id}, category_id: ${sub.category_id})`);
      });
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
        console.log(`   - ${sup.name} (ID: ${sup.id}, code: ${sup.code})`);
      });
    }

    // 4. Проверяем индексы и ограничения
    console.log('\n📊 Проверяю индексы и ограничения...');
    
    // Проверяем уникальность SKU
    const { data: skuTest, error: skuError } = await supabase
      .from('products')
      .select('sku')
      .limit(10);
    
    if (skuError) {
      console.log(`❌ Ошибка проверки SKU: ${skuError.message}`);
    } else {
      const skus = skuTest?.map(p => p.sku).filter(Boolean);
      const uniqueSkus = new Set(skus);
      console.log(`✅ SKU уникальность: ${skus?.length || 0} записей, ${uniqueSkus.size} уникальных`);
    }

    // 5. Тестируем создание продукта
    console.log('\n🧪 Тестирую создание продукта...');
    
    if (categories && categories.length > 0 && suppliers && suppliers.length > 0) {
      const testProduct = {
        sku: `TEST-${Date.now()}`,
        name: 'Test Product for Import',
        description: 'Test product to verify schema',
        category_id: categories[0].id,
        supplier_id: suppliers[0].id,
        specifications: {
          status: 'inactive',
          test: true,
          technicalSpecifications: [],
          colorVariants: []
        }
      };

      const { data: createdProduct, error: createError } = await supabase
        .from('products')
        .insert(testProduct)
        .select()
        .single();

      if (createError) {
        console.log(`❌ Ошибка создания тестового продукта: ${createError.message}`);
      } else {
        console.log(`✅ Тестовый продукт создан: ${createdProduct.sku}`);
        
        // Удаляем тестовый продукт
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', createdProduct.id);
        
        if (deleteError) {
          console.log(`⚠️ Ошибка удаления тестового продукта: ${deleteError.message}`);
        } else {
          console.log('✅ Тестовый продукт удален');
        }
      }
    }

    // 6. Проверяем триггеры
    console.log('\n🔄 Проверяю триггеры...');
    
    // Проверяем, что триггеры subcategories работают
    if (categories && categories.length > 0) {
      const categoryId = categories[0].id;
      
      // Добавляем тестовую подкатегорию
      const { data: testSub, error: subCreateError } = await supabase
        .from('subcategories')
        .insert({
          category_id: categoryId,
          name: `Test Sub ${Date.now()}`,
          slug: `test-sub-${Date.now()}`
        })
        .select()
        .single();

      if (subCreateError) {
        console.log(`❌ Ошибка создания тестовой подкатегории: ${subCreateError.message}`);
      } else {
        console.log(`✅ Тестовая подкатегория создана: ${testSub.name}`);
        
        // Проверяем, что subs обновился
        const { data: updatedCategory, error: catUpdateError } = await supabase
          .from('categories')
          .select('id, name, subs')
          .eq('id', categoryId)
          .single();

        if (catUpdateError) {
          console.log(`❌ Ошибка проверки обновления subs: ${catUpdateError.message}`);
        } else {
          console.log(`✅ Категория обновлена: ${updatedCategory?.subs?.length || 0} подкатегорий`);
        }

        // Удаляем тестовую подкатегорию
        const { error: subDeleteError } = await supabase
          .from('subcategories')
          .delete()
          .eq('id', testSub.id);

        if (subDeleteError) {
          console.log(`⚠️ Ошибка удаления тестовой подкатегории: ${subDeleteError.message}`);
        } else {
          console.log('✅ Тестовая подкатегория удалена');
        }
      }
    }

    console.log('\n🎉 Подготовка завершена!');
    console.log('\n📋 Рекомендации для импорта:');
    console.log('   1. Используйте INTEGER для category_id, subcategory_id, supplier_id');
    console.log('   2. SKU должен быть уникальным');
    console.log('   3. Все дополнительные данные в specifications JSONB');
    console.log('   4. Триггеры автоматически обновляют categories.subs');
    console.log('   5. Проверяйте существование FK перед вставкой');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

prepareForImport();
