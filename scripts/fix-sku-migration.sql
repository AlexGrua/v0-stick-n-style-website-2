-- Безопасная миграция SKU из JSONB в отдельную колонку
-- Выполняется в транзакции для отката при ошибке

begin;

-- 1) Добавляем колонку SKU (если её нет)
alter table public.products
  add column if not exists sku text;

-- 2) Бэконим данные из JSONB в колонку
-- Проверяем разные возможные ключи в specifications
update public.products
   set sku = coalesce(
     specifications->>'sku',
     specifications->>'SKU',
     specifications->>'supplierId'
   )
 where sku is null
   and specifications is not null;

-- 3) Диагностика дубликатов (выполнить отдельно для проверки)
-- select sku, count(*) 
-- from public.products
-- where sku is not null and sku <> ''
-- group by sku
-- having count(*) > 1;

-- 4) Создаем уникальный индекс (частичный, для непустых значений)
create unique index if not exists products_sku_unique_notnull
  on public.products (sku)
  where sku is not null and sku <> '';

-- 5) Обновляем кеш PostgREST
notify pgrst, 'reload schema';

commit;

-- Проверяем результат
select 
  'Total products' as metric,
  count(*) as value
from public.products
union all
select 
  'Products with SKU' as metric,
  count(*) as value
from public.products
where sku is not null and sku <> ''
union all
select 
  'Products without SKU' as metric,
  count(*) as value
from public.products
where sku is null or sku = '';
