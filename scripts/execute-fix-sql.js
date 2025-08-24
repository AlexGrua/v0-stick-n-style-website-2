const http = require('http');

async function executeSQLStep(stepName, sql) {
  console.log(`📝 Выполняю: ${stepName}`);
  
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
          console.log(`✅ ${stepName} выполнено`);
          resolve(result);
        } catch (e) {
          console.log(`❌ ${stepName} ошибка:`, responseData);
          resolve({ error: responseData, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Ошибка ${stepName}:`, error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('🚀 ИСПРАВЛЕНИЕ SUBCATEGORIES\n');

    // Шаг 1: Удаляем кривые subcategories
    await executeSQLStep('Удаление subcategories', 'DROP TABLE IF EXISTS subcategories CASCADE;');

    // Шаг 2: Создаем subcategories правильно
    await executeSQLStep('Создание subcategories', `
      CREATE TABLE subcategories (
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
    `);

    // Шаг 3: Добавляем колонки в products
    await executeSQLStep('Добавление колонок в products', `
      ALTER TABLE IF EXISTS products 
        ADD COLUMN IF NOT EXISTS sku TEXT,
        ADD COLUMN IF NOT EXISTS subcategory_id INTEGER,
        ADD COLUMN IF NOT EXISTS specifications JSONB NOT NULL DEFAULT '{}'::jsonb;
    `);

    // Шаг 4: Добавляем FK
    await executeSQLStep('Добавление FK', `
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
    `);

    // Шаг 5: Создаем индексы
    await executeSQLStep('Создание индексов', `
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);
      CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_specifications_gin ON products USING GIN (specifications);
    `);

    // Шаг 6: Отключаем RLS
    await executeSQLStep('Отключение RLS', `
      ALTER TABLE products DISABLE ROW LEVEL SECURITY;
      ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
      ALTER TABLE subcategories DISABLE ROW LEVEL SECURITY;
      ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
    `);

    // Шаг 7: Добавляем демо-данные
    await executeSQLStep('Добавление демо subcategories', `
      INSERT INTO subcategories (category_id, name, slug, description) 
      SELECT 
        c.id,
        'Plain Color',
        'plain-color',
        'Однотонные панели'
      FROM categories c 
      WHERE c.name = 'Wall Panel';
    `);

    await executeSQLStep('Добавление второй subcategory', `
      INSERT INTO subcategories (category_id, name, slug, description) 
      SELECT 
        c.id,
        'Brick Structure',
        'brick-structure',
        'Панели с текстурой кирпича'
      FROM categories c 
      WHERE c.name = 'Wall Panel';
    `);

    // Шаг 8: Добавляем демо-продукт
    await executeSQLStep('Добавление демо-продукта', `
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
        'DEMO-001',
        'Демо панель',
        'Тестовая панель для проверки',
        c.id,
        sc.id,
        s.id,
        'https://via.placeholder.com/300x200',
        1000,
        true,
        'demo-panel',
        '{"status": "active", "colorVariants": [{"name": "Белый", "code": "WHITE"}]}'::jsonb
      FROM categories c
      JOIN subcategories sc ON sc.category_id = c.id
      JOIN suppliers s ON s.code = 'S001'
      WHERE c.name = 'Wall Panel' 
        AND sc.name = 'Plain Color'
        AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'DEMO-001');
    `);

    // Шаг 9: Обновляем кеш PostgREST
    await executeSQLStep('Обновление кеша PostgREST', `
      NOTIFY pgrst, 'reload schema';
      SELECT pg_notify('pgrst', 'reload schema');
    `);

    console.log('\n✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!');
    console.log('📋 Теперь перезапустите API в Supabase и проверьте результат');

  } catch (error) {
    console.error('❌ Ошибка исправления:', error);
  }
}

main();
