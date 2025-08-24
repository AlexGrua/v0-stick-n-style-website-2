# 🚀 ВЫПОЛНЕНИЕ МИГРАЦИИ 001 - ПРЯМО СЕЙЧАС

## ⚡ БЫСТРАЯ ИНСТРУКЦИЯ

### 1️⃣ ПОДГОТОВКА (2 минуты)
- [ ] Открыть Supabase Console → SQL Editor
- [ ] Убедиться что это DEV/STAGING (не PROD!)
- [ ] Сделать backup: Supabase → Backups/Point-in-time
- [ ] Отключить активные импорты/редакторы

### 2️⃣ ВЫПОЛНЕНИЕ (1 минута)
- [ ] Скопировать SQL из `001_hotfix_add_missing_columns.sql`
- [ ] Выделить только от `BEGIN` до `COMMIT`
- [ ] Выполнить в SQL Editor
- [ ] Убедиться что нет ошибок

### 3️⃣ ПРОВЕРКА (3 минуты)
- [ ] Выполнить `quick-checks.sql`
- [ ] Проверить что все колонки добавлены
- [ ] Проверить что таблица subcategories создана
- [ ] Проверить что FK и индексы работают

### 4️⃣ ТЕСТИРОВАНИЕ (5 минут)
- [ ] Проверить API: `/api/products`, `/api/categories`
- [ ] Скачать Excel template
- [ ] Импортировать 1-2 тестовые строки
- [ ] Убедиться что нет ошибок "нет поля/таблицы"

## 📋 SQL ДЛЯ КОПИРОВАНИЯ

```sql
BEGIN;

-- 1. Добавляем недостающие колонки в products (идемпотентно)
ALTER TABLE IF EXISTS products 
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS subcategory_id INTEGER,
  ADD COLUMN IF NOT EXISTS specifications JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Создаем таблицу subcategories если её нет (идемпотентно)
CREATE TABLE IF NOT EXISTS subcategories (
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

-- 3. Добавляем FK для subcategory_id если его нет (идемпотентно)
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

-- 4. Создаем индексы для производительности (идемпотентно)
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_products_specifications_gin ON products USING GIN (specifications);

-- 5. Временно отключаем RLS для админки (если включена)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'products' 
      AND rowsecurity = true
  ) THEN
    ALTER TABLE products DISABLE ROW LEVEL SECURITY;
    ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
    ALTER TABLE subcategories DISABLE ROW LEVEL SECURITY;
    ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 6. Добавляем демо-данные только в dev окружении
DO $$
BEGIN
  -- Проверяем что это dev окружение (можно настроить по-другому)
  IF current_setting('app.environment', true) IS NULL OR current_setting('app.environment', true) = 'development' THEN
    
    -- Добавляем Plain Color subcategory
    INSERT INTO subcategories (category_id, name, slug, description) 
    SELECT 
      c.id,
      'Plain Color',
      'plain-color',
      'Однотонные панели'
    FROM categories c 
    WHERE c.name = 'Wall Panel' 
      AND NOT EXISTS (
        SELECT 1 FROM subcategories sc 
        WHERE sc.category_id = c.id AND sc.name = 'Plain Color'
      );

    -- Добавляем Brick Structure subcategory  
    INSERT INTO subcategories (category_id, name, slug, description) 
    SELECT 
      c.id,
      'Brick Structure',
      'brick-structure',
      'Панели с текстурой кирпича'
    FROM categories c 
    WHERE c.name = 'Wall Panel' 
      AND NOT EXISTS (
        SELECT 1 FROM subcategories sc 
        WHERE sc.category_id = c.id AND sc.name = 'Brick Structure'
      );
  END IF;
END $$;

COMMIT;

-- 7. Обновляем кеш PostgREST
NOTIFY pgrst, 'reload schema';
```

## ✅ КРИТЕРИИ УСПЕХА

- [ ] Миграция выполнилась без ошибок
- [ ] Все колонки добавлены в `products`
- [ ] Таблица `subcategories` создана
- [ ] FK связи работают
- [ ] API возвращает данные без ошибок
- [ ] Импорт работает с тестовыми данными

## 🚨 ЕСЛИ ЧТО-ТО ПОШЛО НЕ ТАК

1. **Ошибка миграции** - проверить логи, повторить
2. **API не работает** - перезапустить приложение
3. **Импорт не работает** - проверить PostgREST кеш
4. **Критическая ошибка** - использовать backup для отката

## 📝 ПОСЛЕ УСПЕШНОГО ВЫПОЛНЕНИЯ

- [ ] Записать дату/время выполнения
- [ ] Отметить окружение (dev/staging/prod)
- [ ] Записать хэш коммита
- [ ] Планировать включение RLS (см. `RLS-PRODUCTION-PLAN.md`)

---

**Время выполнения:** ~10 минут  
**Статус:** Готов к выполнению  
**Следующий этап:** Этап 2 - структурирование и нормализация
