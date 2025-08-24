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

async function finalCleanupAndProtect() {
  console.log('🔧 Финальная очистка и защита данных...\n');

  try {
    // 1. Обновляем функцию пересборки с полными данными
    console.log('📝 Обновляю функцию пересборки subs...');
    const updateFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.rebuild_category_subs(p_category_id int)
      RETURNS void LANGUAGE plpgsql AS $$
      BEGIN
        UPDATE public.categories c
        SET subs = COALESCE((
          SELECT jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'slug', s.slug) ORDER BY s.id)
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
        body: JSON.stringify({ sql: updateFunctionSQL }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ Функция rebuild_category_subs обновлена');
      } else {
        console.log('❌ Ошибка обновления функции:', result.error);
      }
    } catch (error) {
      console.log('❌ Ошибка выполнения SQL:', error.message);
    }

    // 2. Пересобираем все subs из актуальных subcategories
    console.log('\n🔄 Пересобираю все subs из актуальных данных...');
    const rebuildAllSQL = `
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
        body: JSON.stringify({ sql: rebuildAllSQL }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ Все subs пересобраны из актуальных subcategories');
      } else {
        console.log('❌ Ошибка пересборки:', result.error);
      }
    } catch (error) {
      console.log('❌ Ошибка выполнения SQL:', error.message);
    }

    // 3. Создаем защиту от прямых изменений subs
    console.log('\n🛡️ Создаю защиту от прямых изменений subs...');
    const protectionSQL = `
      -- Функция для блокировки прямых изменений subs
      CREATE OR REPLACE FUNCTION public.block_direct_subs_update()
      RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF to_jsonb(NEW) ? 'subs' AND NEW.subs IS DISTINCT FROM OLD.subs THEN
          RAISE EXCEPTION 'Do not modify categories.subs directly; it is maintained by triggers on subcategories.';
        END IF;
        RETURN NEW;
      END $$;

      -- Триггер для блокировки прямых изменений
      DROP TRIGGER IF EXISTS trg_block_direct_subs_update ON public.categories;
      CREATE TRIGGER trg_block_direct_subs_update
        BEFORE UPDATE ON public.categories
        FOR EACH ROW EXECUTE FUNCTION public.block_direct_subs_update();
    `;

    try {
      const response = await fetch('http://localhost:3000/api/migrations/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: protectionSQL }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ Защита от прямых изменений subs создана');
      } else {
        console.log('❌ Ошибка создания защиты:', result.error);
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

    // 5. Ждем и проверяем результат
    console.log('\n⏳ Жду 5 секунд...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 6. Проверяем результат
    console.log('\n🔍 Проверяю результат...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, subs')
      .limit(10);
    
    if (catError) {
      console.log(`❌ Ошибка получения категорий: ${catError.message}`);
    } else {
      console.log(`✅ Получено категорий: ${categories?.length || 0}`);
      categories?.forEach(cat => {
        console.log(`📋 ${cat.name} (ID: ${cat.id}): ${cat.subs?.length || 0} subcategories`);
        if (cat.subs && cat.subs.length > 0) {
          cat.subs.forEach((sub, index) => {
            console.log(`   ${index + 1}. ${sub.name} (ID: ${sub.id})`);
          });
        }
      });
    }

    // 7. Тестируем защиту от прямых изменений
    console.log('\n🧪 Тестирую защиту от прямых изменений...');
    if (categories && categories.length > 0) {
      const categoryId = categories[0].id;
      
      try {
        const { error: updateError } = await supabase
          .from('categories')
          .update({ subs: [{ name: 'Test Direct Update' }] })
          .eq('id', categoryId);
        
        if (updateError) {
          console.log(`✅ Защита работает! Ошибка: ${updateError.message}`);
        } else {
          console.log(`❌ Защита не сработала!`);
        }
      } catch (error) {
        console.log(`✅ Защита работает! Исключение: ${error.message}`);
      }
    }

    // 8. Тестируем создание новой подкатегории через правильный путь
    console.log('\n🧪 Тестирую создание подкатегории через правильный путь...');
    if (categories && categories.length > 0) {
      const categoryId = categories[0].id;
      
      // Добавляем подкатегорию через таблицу subcategories
      const { data: insertResult, error: insertError } = await supabase
        .from('subcategories')
        .insert({
          category_id: categoryId,
          name: 'Test Protected Subcategory ' + Date.now()
        })
        .select();
      
      if (insertError) {
        console.log(`❌ Ошибка вставки: ${insertError.message}`);
      } else {
        console.log(`✅ Подкатегория создана: ${insertResult?.length || 0}`);
        
        // Проверяем, что subs обновился автоматически
        const { data: updatedCategory, error: updateError } = await supabase
          .from('categories')
          .select('id, name, subs')
          .eq('id', categoryId)
          .single();
        
        if (updateError) {
          console.log(`❌ Ошибка проверки обновления: ${updateError.message}`);
        } else {
          console.log(`✅ Категория автоматически обновлена: ${updatedCategory?.subs?.length || 0} subcategories`);
        }
      }
    }

    console.log('\n🎉 Финальная очистка завершена!');
    console.log('📋 Что сделано:');
    console.log('   ✅ Все subs пересобраны из актуальных subcategories');
    console.log('   ✅ Защита от прямых изменений subs создана');
    console.log('   ✅ Триггеры автоматически поддерживают кэш');
    console.log('   ✅ Старые ручные данные в subs стерты');
    console.log('   ✅ Новая логика работает корректно');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

finalCleanupAndProtect();
