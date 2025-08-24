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

async function testProductCreation() {
  console.log('🧪 Тестирую создание продукта...\n');

  try {
    // 1. Проверяем существующие категории
    console.log('📋 Проверяю существующие категории...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .limit(3);

    if (catError) {
      console.log(`❌ Ошибка чтения категорий: ${catError.message}`);
      return;
    }

    console.log(`✅ Найдено категорий: ${categories?.length || 0}`);
    if (categories && categories.length > 0) {
      console.log('📋 Категории:', categories.map(c => `${c.name} (ID: ${c.id})`));
    }

    // 2. Создаем тестовый продукт
    console.log('\n📝 Создаю тестовый продукт...');
    const testProduct = {
      name: 'Test Product API',
      description: 'Test product created via API',
      category_id: categories?.[0]?.id || 8,
      price: 100,
      slug: 'test-product-api-' + Date.now(),
      specifications: {
        sku: 'TEST-API-' + Date.now(),
        supplierId: '4',
        status: 'inactive',
        technicalDescription: 'Test technical description',
        sizes: ['100x100'],
        thickness: ['10mm'],
        pcsPerBox: 10,
        boxKg: 5.5,
        boxM3: 0.001,
        minOrderBoxes: 1,
        technicalSpecifications: [
          {
            size: '100x100',
            sizeCode: '100',
            thicknesses: [
              {
                thickness: '10mm',
                pcsPerBox: 10,
                boxWeight: 5.5,
                boxVolume: 0.001
              }
            ]
          }
        ],
        colorVariants: [
          {
            name: 'Test Color',
            colorCode: 'TEST',
            priceModifier: 0
          }
        ]
      }
    };

    const { data: newProduct, error: createError } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single();

    if (createError) {
      console.log(`❌ Ошибка создания продукта: ${createError.message}`);
      return;
    }

    console.log(`✅ Продукт создан успешно: ${newProduct.name} (ID: ${newProduct.id})`);
    console.log(`📋 SKU: ${newProduct.specifications?.sku}`);
    console.log(`📋 Supplier ID: ${newProduct.specifications?.supplierId}`);

    // 3. Проверяем созданный продукт
    console.log('\n🔍 Проверяю созданный продукт...');
    const { data: createdProduct, error: readError } = await supabase
      .from('products')
      .select('*')
      .eq('id', newProduct.id)
      .single();

    if (readError) {
      console.log(`❌ Ошибка чтения продукта: ${readError.message}`);
    } else {
      console.log(`✅ Продукт прочитан: ${createdProduct.name}`);
      console.log(`📋 Specifications:`, createdProduct.specifications);
    }

    // 4. Удаляем тестовый продукт
    console.log('\n🗑️ Удаляю тестовый продукт...');
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', newProduct.id);

    if (deleteError) {
      console.log(`❌ Ошибка удаления продукта: ${deleteError.message}`);
    } else {
      console.log('✅ Тестовый продукт удален');
    }

    console.log('\n🎉 Тест создания продукта завершен успешно!');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

testProductCreation();
