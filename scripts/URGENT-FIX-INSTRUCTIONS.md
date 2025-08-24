# 🚨 СРОЧНОЕ ИСПРАВЛЕНИЕ: ПРОБЛЕМА С POSTGREST КЕШЕМ

## ❌ ПРОБЛЕМА
PostgREST кеш не обновился после миграции, поэтому:
- Ошибки FK связей все еще появляются
- Колонка `sku` не найдена при импорте
- `/api/subcategories` возвращает 500 ошибку

## 🔧 РЕШЕНИЕ

### Вариант 1: Перезапуск сервера (РЕКОМЕНДУЕТСЯ)
```bash
# 1. Остановите сервер (Ctrl+C)
# 2. Запустите заново
npm run dev
```

### Вариант 2: Принудительное обновление кеша в Supabase
1. **Откройте Supabase Console** → SQL Editor
2. **Выполните SQL** из файла `scripts/force-reload-supabase.sql`
3. **Или выполните только:**
```sql
NOTIFY pgrst, 'reload schema';
```

### Вариант 3: Проверка в Supabase Console
1. **Откройте Supabase Console** → Table Editor
2. **Проверьте что таблица `subcategories` существует**
3. **Проверьте что в `products` есть колонки:**
   - `sku` (TEXT)
   - `subcategory_id` (INTEGER)
   - `specifications` (JSONB)

## 🧪 ПРОВЕРКА РЕЗУЛЬТАТА

После исправления:
1. **Откройте админку** http://localhost:3001/admin/catalog
2. **Проверьте консоль браузера** - ошибки FK должны исчезнуть
3. **Попробуйте импорт продуктов** - должен работать без ошибок

## 📋 КОМАНДЫ ДЛЯ ПРОВЕРКИ

```bash
# Проверка API endpoints
node scripts/test-api-endpoints.js

# Проверка миграции
node scripts/check-migration-result.js
```

---

**Статус:** 🚨 ТРЕБУЕТ ВМЕШАТЕЛЬСТВА  
**Приоритет:** ВЫСОКИЙ  
**Время исправления:** ~2-5 минут
