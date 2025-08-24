const http = require('http');

async function executeSQL(sql) {
  console.log(`📝 Выполняю: ${sql.substring(0, 50)}...`);
  
  const data = JSON.stringify({ sql });
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/migrations/execute-sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          console.log(`✅ Выполнено`);
          resolve(result);
        } catch (e) {
          console.log(`❌ Ошибка:`, responseData);
          resolve({ error: responseData, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Ошибка:`, error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function createTestData() {
  try {
    console.log('🚀 СОЗДАНИЕ ТЕСТОВЫХ ДАННЫХ\n');

    // 1. Создаем категории
    await executeSQL(`
      INSERT INTO categories (name, slug, description, sort_order, is_active)
      VALUES 
        ('Wall Panel', 'wall-panel', 'Стеновые панели', 1, true),
        ('Flooring', 'flooring', 'Напольные покрытия', 2, true),
        ('Ceiling', 'ceiling', 'Потолочные панели', 3, true)
      ON CONFLICT (slug) DO NOTHING;
    `);

    // 2. Создаем subcategories
    await executeSQL(`
      INSERT INTO subcategories (category_id, name, slug, description)
      SELECT 
        c.id,
        'Plain Color',
        'plain-color',
        'Однотонные панели'
      FROM categories c 
      WHERE c.name = 'Wall Panel'
      ON CONFLICT (category_id, slug) DO NOTHING;
    `);

    await executeSQL(`
      INSERT INTO subcategories (category_id, name, slug, description)
      SELECT 
        c.id,
        'Brick Structure',
        'brick-structure',
        'Панели с текстурой кирпича'
      FROM categories c 
      WHERE c.name = 'Wall Panel'
      ON CONFLICT (category_id, slug) DO NOTHING;
    `);

    await executeSQL(`
      INSERT INTO subcategories (category_id, name, slug, description)
      SELECT 
        c.id,
        'Wood Pattern',
        'wood-pattern',
        'Панели с текстурой дерева'
      FROM categories c 
      WHERE c.name = 'Flooring'
      ON CONFLICT (category_id, slug) DO NOTHING;
    `);

    // 3. Создаем поставщиков
    await executeSQL(`
      INSERT INTO suppliers (code, name, contact_person, email, phone, status)
      VALUES 
        ('S001', 'ООО "СтройМатериалы"', 'Иван Петров', 'ivan@stroymat.ru', '+7-999-123-45-67', 'active'),
        ('S002', 'ИП "ПанелиПро"', 'Мария Сидорова', 'maria@panelipro.ru', '+7-999-234-56-78', 'active'),
        ('S003', 'ЗАО "ИнтерьерСтиль"', 'Алексей Козлов', 'alex@interiorstyle.ru', '+7-999-345-67-89', 'active')
      ON CONFLICT (code) DO NOTHING;
    `);

    // 4. Создаем тестовые продукты
    await executeSQL(`
      INSERT INTO products (
        sku, 
        name, 
        description, 
        category_id, 
        subcategory_id, 
        supplier_id, 
        image_url, 
        price, 
        in_stock, 
        slug, 
        specifications
      ) 
      SELECT 
        'TEST-001',
        'Белая стеновая панель',
        'Однотонная белая панель для стен',
        c.id,
        sc.id,
        s.id,
        'https://via.placeholder.com/300x200/FFFFFF/000000?text=White+Panel',
        1500,
        true,
        'white-wall-panel',
        '{"status": "active", "colorVariants": [{"name": "Белый", "code": "WHITE"}], "size": "600x300mm", "thickness": "8mm"}'::jsonb
      FROM categories c
      JOIN subcategories sc ON sc.category_id = c.id
      JOIN suppliers s ON s.code = 'S001'
      WHERE c.name = 'Wall Panel' 
        AND sc.name = 'Plain Color'
        AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'TEST-001');
    `);

    await executeSQL(`
      INSERT INTO products (
        sku, 
        name, 
        description, 
        category_id, 
        subcategory_id, 
        supplier_id, 
        image_url, 
        price, 
        in_stock, 
        slug, 
        specifications
      ) 
      SELECT 
        'TEST-002',
        'Кирпичная текстура',
        'Панель с текстурой красного кирпича',
        c.id,
        sc.id,
        s.id,
        'https://via.placeholder.com/300x200/8B4513/FFFFFF?text=Brick+Panel',
        2200,
        true,
        'brick-texture-panel',
        '{"status": "active", "colorVariants": [{"name": "Красный кирпич", "code": "RED_BRICK"}], "size": "600x300mm", "thickness": "12mm"}'::jsonb
      FROM categories c
      JOIN subcategories sc ON sc.category_id = c.id
      JOIN suppliers s ON s.code = 'S002'
      WHERE c.name = 'Wall Panel' 
        AND sc.name = 'Brick Structure'
        AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'TEST-002');
    `);

    await executeSQL(`
      INSERT INTO products (
        sku, 
        name, 
        description, 
        category_id, 
        subcategory_id, 
        supplier_id, 
        image_url, 
        price, 
        in_stock, 
        slug, 
        specifications
      ) 
      SELECT 
        'TEST-003',
        'Дубовый паркет',
        'Напольное покрытие под дуб',
        c.id,
        sc.id,
        s.id,
        'https://via.placeholder.com/300x200/DEB887/000000?text=Oak+Flooring',
        3500,
        true,
        'oak-flooring',
        '{"status": "active", "colorVariants": [{"name": "Дуб", "code": "OAK"}], "size": "1200x200mm", "thickness": "15mm"}'::jsonb
      FROM categories c
      JOIN subcategories sc ON sc.category_id = c.id
      JOIN suppliers s ON s.code = 'S003'
      WHERE c.name = 'Flooring' 
        AND sc.name = 'Wood Pattern'
        AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'TEST-003');
    `);

    // 5. Обновляем кеш PostgREST
    await executeSQL(`NOTIFY pgrst, 'reload schema';`);

    console.log('\n✅ ТЕСТОВЫЕ ДАННЫЕ СОЗДАНЫ!');
    console.log('📋 Создано:');
    console.log('  - 3 категории (Wall Panel, Flooring, Ceiling)');
    console.log('  - 3 подкатегории (Plain Color, Brick Structure, Wood Pattern)');
    console.log('  - 3 поставщика (S001, S002, S003)');
    console.log('  - 3 тестовых продукта (TEST-001, TEST-002, TEST-003)');
    console.log('\n🌐 Откройте http://localhost:3001/admin/catalog для проверки');

  } catch (error) {
    console.error('❌ Ошибка создания тестовых данных:', error);
  }
}

createTestData();
