# 🗄️ Миграции базы данных

## 📋 Обзор

Эта папка содержит SQL-миграции для базы данных. **Единый источник правды** - это БД и её миграции.

## 🚀 Принципы

1. **Все изменения схемы** - только через миграции
2. **Никаких DDL мимо миграций** 
3. **Каждая миграция** - атомарная транзакция
4. **Версионирование** - по номеру файла

## 📁 Структура файлов

```
001_hotfix_add_missing_columns.sql  # Хотфикс для импорта
002_create_unified_schema.sql       # Единая схема (будущее)
003_add_product_variants.sql        # Варианты продуктов (будущее)
```

## 🔧 Выполнение миграций

### В Supabase SQL Editor:
1. Откройте SQL Editor в Supabase Console
2. Скопируйте содержимое миграции
3. Выполните SQL
4. Проверьте результат

### Через Supabase CLI (будущее):
```bash
supabase db push
```

## ✅ Чек-лист после миграции

- [ ] Миграция выполнилась без ошибок
- [ ] Новые колонки/таблицы созданы
- [ ] Индексы созданы
- [ ] Демо-данные добавлены
- [ ] API работает без ошибок
- [ ] Импорт/экспорт работает

## 🚨 Важно

- **Всегда делайте backup** перед миграцией
- **Тестируйте на dev** перед prod
- **Документируйте изменения** в комментариях
- **Проверяйте откат** (rollback) если возможно

## 🔒 RLS (Row Level Security)

**ВНИМАНИЕ:** Миграция 001 временно отключает RLS для админки.

### После выполнения миграции:
1. **Настройте RLS policies** для production
2. **Включите RLS обратно** с правильными политиками
3. **Протестируйте права доступа** для разных ролей

### Пример RLS policies для админки:
```sql
-- Включить RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Создать policies для админов
CREATE POLICY "Admins can do everything" ON products
  FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can do everything" ON categories  
  FOR ALL USING (auth.role() = 'admin');
```

## 📞 Поддержка

При проблемах с миграциями обращайтесь к команде разработки.
