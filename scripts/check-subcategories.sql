-- Проверяем подкатегории в категории Wall Panel
SELECT 
  'Categories' as table_name,
  id,
  name,
  slug
FROM categories 
WHERE name = 'Wall Panel';

-- Проверяем подкатегории для Wall Panel
SELECT 
  'Subcategories for Wall Panel' as info,
  sc.id,
  sc.name,
  sc.slug,
  sc.description,
  c.name as category_name
FROM subcategories sc
JOIN categories c ON sc.category_id = c.id
WHERE c.name = 'Wall Panel'
ORDER BY sc.name;

-- Проверяем все подкатегории
SELECT 
  'All Subcategories' as info,
  sc.id,
  sc.name,
  sc.slug,
  c.name as category_name
FROM subcategories sc
JOIN categories c ON sc.category_id = c.id
ORDER BY c.name, sc.name;

-- Проверяем структуру таблицы subcategories
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subcategories'
AND table_schema = 'public'
ORDER BY ordinal_position;
