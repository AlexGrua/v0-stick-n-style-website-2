// Используем встроенный fetch в Node.js

async function testAPI() {
  console.log('🧪 Тестируем API через HTTP...\n');

  const baseUrl = 'http://localhost:3000/api';

  // 1. Тест получения продуктов
  console.log('1. Тестируем GET /api/products...');
  try {
    const response = await fetch(`${baseUrl}/products?limit=1`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Продукты получены успешно:', data.items?.length || 0);
      if (data.items && data.items.length > 0) {
        console.log('   Пример продукта:', {
          id: data.items[0].id,
          name: data.items[0].name,
          sku: data.items[0].sku,
          category: data.items[0].category
        });
      }
    } else {
      console.error('❌ Ошибка получения продуктов:', data);
    }
  } catch (err) {
    console.error('❌ Исключение при получении продуктов:', err.message);
  }

  // 2. Тест получения категорий
  console.log('\n2. Тестируем GET /api/categories...');
  try {
    const response = await fetch(`${baseUrl}/categories`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Категории получены успешно:', data.items?.length || 0);
      if (data.items && data.items.length > 0) {
        console.log('   Примеры категорий:', data.items.slice(0, 3).map(c => ({
          id: c.id,
          name: c.name,
          subs_count: c.subs ? c.subs.length : 0
        })));
      }
    } else {
      console.error('❌ Ошибка получения категорий:', data);
    }
  } catch (err) {
    console.error('❌ Исключение при получении категорий:', err.message);
  }

  // 3. Тест получения поставщиков
  console.log('\n3. Тестируем GET /api/suppliers...');
  try {
    const response = await fetch(`${baseUrl}/suppliers`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Поставщики получены успешно:', data.items?.length || 0);
    } else {
      console.error('❌ Ошибка получения поставщиков:', data);
    }
  } catch (err) {
    console.error('❌ Исключение при получении поставщиков:', err.message);
  }

  console.log('\n🏁 Тестирование завершено!');
}

// Ждем немного, чтобы сервер запустился
setTimeout(testAPI, 3000);
