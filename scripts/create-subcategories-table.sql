-- Создание таблицы subcategories
-- Выполнить в Supabase SQL Editor

BEGIN;

-- 1. Создаем таблицу subcategories если её нет
CREATE TABLE IF NOT EXISTS public.subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
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

-- 2. Добавляем недостающие колонки в products
ALTER TABLE IF EXISTS public.products 
  ADD COLUMN IF NOT EXISTS subcategory_id INTEGER,
  ADD COLUMN IF NOT EXISTS specifications JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 3. Добавляем FK для subcategory_id если его нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' 
      AND table_name = 'products' 
      AND constraint_name = 'products_subcategory_fk'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_subcategory_fk 
      FOREIGN KEY (subcategory_id) 
      REFERENCES public.subcategories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_products_specifications_gin ON public.products USING GIN (specifications);

-- 5. Временно отключаем RLS для админки
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'products' 
      AND rowsecurity = true
  ) THEN
    ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.subcategories DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 6. Добавляем демо-данные
INSERT INTO public.subcategories (category_id, name, slug, description) 
SELECT 
  c.id,
  'Plain Color',
  'plain-color',
  'Однотонные панели'
FROM public.categories c 
WHERE c.name = 'Wall Panel' 
  AND NOT EXISTS (
    SELECT 1 FROM public.subcategories sc 
    WHERE sc.category_id = c.id AND sc.name = 'Plain Color'
  );

INSERT INTO public.subcategories (category_id, name, slug, description) 
SELECT 
  c.id,
  'Brick Structure',
  'brick-structure',
  'Панели с текстурой кирпича'
FROM public.categories c 
WHERE c.name = 'Wall Panel' 
  AND NOT EXISTS (
    SELECT 1 FROM public.subcategories sc 
    WHERE sc.category_id = c.id AND sc.name = 'Brick Structure'
  );

COMMIT;

-- 7. Обновляем кеш PostgREST
NOTIFY pgrst, 'reload schema';

-- Проверяем результат
SELECT 
  'Tables created' as status,
  count(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('subcategories', 'categories', 'products', 'suppliers')
UNION ALL
SELECT 
  'Subcategories count' as status,
  count(*) as count
FROM public.subcategories;
