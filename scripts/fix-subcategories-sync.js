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

async function fixSubcategoriesSync() {
  console.log('🔧 Исправляю синхронизацию subcategories...\n');

  try {
    // 1. Создаем функцию для пересборки subs
    console.log('📝 Создаю функцию пересборки subs...');
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.rebuild_category_subs(p_category_id int)
      RETURNS void LANGUAGE plpgsql AS $$
      BEGIN
        UPDATE public.categories c
        SET subs = COALESCE((
          SELECT jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name) ORDER BY s.id)
          FROM public.subcategories s
          WHERE s.category_id = p_category_id
        ), '[]'::jsonb)
        WHERE c.id = p_category_id;
      END $$;
    `;

    try {
      const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: createFunctionSQL }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ Функция rebuild_category_subs создана');
      } else {
        console.log('❌ Ошибка создания функции:', result.error);
      }
    } catch (error) {
      console.log('❌ Ошибка выполнения SQL:', error.message);
    }

    // 2. Создаем триггеры
    console.log('\n🔗 Создаю триггеры...');
    const createTriggersSQL = `
      -- Триггер для INSERT
      DROP TRIGGER IF EXISTS trg_subcategories_ins ON public.subcategories;
      CREATE TRIGGER trg_subcategories_ins
      AFTER INSERT ON public.subcategories
      FOR EACH ROW EXECUTE FUNCTION public.rebuild_category_subs(NEW.category_id);

      -- Триггер для UPDATE
      DROP TRIGGER IF EXISTS trg_subcategories_upd ON public.subcategories;
      CREATE TRIGGER trg_subcategories_upd
      AFTER UPDATE ON public.subcategories
      FOR EACH ROW EXECUTE FUNCTION public.rebuild_category_subs(COALESCE(NEW.category_id, OLD.category_id));

      -- Триггер для DELETE
      DROP TRIGGER IF EXISTS trg_subcategories_del ON public.subcategories;
      CREATE TRIGGER trg_subcategories_del
      AFTER DELETE ON public.subcategories
      FOR EACH ROW EXECUTE FUNCTION public.rebuild_category_subs(OLD.category_id);
    `;

    try {
      const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: createTriggersSQL }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ Триггеры созданы');
      } else {
        console.log('❌ Ошибка создания триггеров:', result.error);
      }
    } catch (error) {
      console.log('❌ Ошибка выполнения SQL:', error.message);
    }

    // 3. Синхронизируем существующие данные
    console.log('\n🔄 Синхронизирую существующие данные...');
    const syncExistingSQL = `
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN SELECT id FROM public.categories LOOP
          PERFORM public.rebuild_category_subs(r.id);
        END LOOP;
      END $$;
    `;

    try {
      const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: syncExistingSQL }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ Существующие данные синхронизированы');
      } else {
        console.log('❌ Ошибка синхронизации:', result.error);
      }
    } catch (error) {
      console.log('❌ Ошибка выполнения SQL:', error.message);
    }

    // 4. Перезагружаем PostgREST
    console.log('\n🔄 Перезагружаю PostgREST...');
    const reloadSQL = `
      NOTIFY pgrst, 'reload schema';
      SELECT pg_notify('pgrst', 'reload schema');
    `;

    try {
      const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: reloadSQL }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ PostgREST перезагружен');
      } else {
        console.log('❌ Ошибка перезагрузки PostgREST:', result.error);
      }
    } catch (error) {
      console.log('❌ Ошибка выполнения SQL:', error.message);
    }

    // 5. Ждем и проверяем
    console.log('\n⏳ Жду 5 секунд...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 6. Проверяем результат
    console.log('\n🔍 Проверяю результат...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, subs')
      .limit(5);
    
    if (catError) {
      console.log(`❌ Ошибка получения категорий: ${catError.message}`);
    } else {
      console.log(`✅ Получено категорий: ${categories?.length || 0}`);
      categories?.forEach(cat => {
        console.log(`📋 ${cat.name} (ID: ${cat.id}): ${cat.subs?.length || 0} subcategories`);
      });
    }

    // 7. Тестируем создание новой подкатегории
    console.log('\n🧪 Тестирую создание новой подкатегории...');
    if (categories && categories.length > 0) {
      const categoryId = categories[0].id;
      
      // Добавляем тестовую подкатегорию
      const { data: insertResult, error: insertError } = await supabase
        .from('subcategories')
        .insert({
          category_id: categoryId,
          name: 'Test Subcategory ' + Date.now()
        })
        .select();
      
      if (insertError) {
        console.log(`❌ Ошибка вставки: ${insertError.message}`);
      } else {
        console.log(`✅ Тестовая подкатегория создана: ${insertResult?.length || 0}`);
        
        // Проверяем, что subs обновился
        const { data: updatedCategory, error: updateError } = await supabase
          .from('categories')
          .select('id, name, subs')
          .eq('id', categoryId)
          .single();
        
        if (updateError) {
          console.log(`❌ Ошибка проверки обновления: ${updateError.message}`);
        } else {
          console.log(`✅ Категория обновлена: ${updatedCategory?.subs?.length || 0} subcategories`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

fixSubcategoriesSync();
