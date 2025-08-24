-- Исправляем статусы поставщиков на active/inactive
-- Заменяем старые статусы на новые

UPDATE public.suppliers 
SET status = 'active' 
WHERE status IN ('approved', 'pending', 'blocked') 
   OR status IS NULL;

-- Проверяем результат
SELECT id, name, status FROM public.suppliers ORDER BY id;

-- Уведомляем PostgREST о изменении схемы
NOTIFY pgrst, 'reload schema';
