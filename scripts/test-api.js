const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAPI() {
  console.log('🧪 Тестируем API endpoints...\n');

  // 1. Тест получения продуктов
  console.log('1. Тестируем GET /api/products...');
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id(id, name, slug, description)
      `)
      .limit(1);

    if (error) {
      console.error('❌ Ошибка получения продуктов:', error);
    } else {
      console.log('✅ Продукты получены успешно:', products?.length || 0);
      if (products && products.length > 0) {
        console.log('   Пример продукта:', {
          id: products[0].id,
          name: products[0].name,
          sku: products[0].sku,
          category: products[0].categories?.name
        });
      }
    }
  } catch (err) {
    console.error('❌ Исключение при получении продуктов:', err);
  }

  // 2. Тест получения категорий
  console.log('\n2. Тестируем GET /api/categories...');
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .limit(3);

    if (error) {
      console.error('❌ Ошибка получения категорий:', error);
    } else {
      console.log('✅ Категории получены успешно:', categories?.length || 0);
      if (categories && categories.length > 0) {
        console.log('   Примеры категорий:', categories.map(c => ({
          id: c.id,
          name: c.name,
          subs_count: c.subs ? c.subs.length : 0
        })));
      }
    }
  } catch (err) {
    console.error('❌ Исключение при получении категорий:', err);
  }

  // 3. Тест создания продукта
  console.log('\n3. Тестируем создание продукта...');
  try {
    const testProduct = {
      name: 'Test Product API',
      description: 'Test product created via API',
      category_id: 4, // Wall Panel
      sku: 'TEST-API-' + Date.now(),
      specifications: {
        supplierId: 'TEST-SUPPLIER',
        status: 'inactive',
        sku: 'TEST-API-' + Date.now()
      },
      price: 0,
      in_stock: true,
      slug: 'test-product-api-' + Date.now()
    };

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка создания продукта:', error);
    } else {
      console.log('✅ Продукт создан успешно:', {
        id: newProduct.id,
        name: newProduct.name,
        sku: newProduct.sku
      });

      // Удаляем тестовый продукт
      await supabase.from('products').delete().eq('id', newProduct.id);
      console.log('   Тестовый продукт удален');
    }
  } catch (err) {
    console.error('❌ Исключение при создании продукта:', err);
  }

  console.log('\n🏁 Тестирование завершено!');
}

testAPI().catch(console.error);
