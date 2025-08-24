# 🔒 План включения RLS для Production

## 📋 Обзор

После успешного выполнения миграции 001, RLS временно отключен для админки. Этот документ описывает план включения RLS обратно для production.

## 🚨 Текущее состояние

- RLS отключен на всех таблицах: `products`, `categories`, `subcategories`, `suppliers`
- Админка работает без ограничений
- **НЕ БЕЗОПАСНО для production!**

## 🎯 Цель

Включить RLS с правильными политиками для:
- Администраторов (полный доступ)
- Обычных пользователей (только чтение)
- API ключей (ограниченный доступ)

## 📋 План выполнения

### Этап 1: Подготовка (DEV/STAGING)
- [ ] Создать тестовые пользователи с разными ролями
- [ ] Написать RLS policies
- [ ] Протестировать на dev/staging
- [ ] Убедиться что админка работает

### Этап 2: Production
- [ ] Сделать backup БД
- [ ] Выполнить в окне минимальной нагрузки
- [ ] Включить RLS с policies
- [ ] Протестировать все функции

## 🔧 RLS Policies

### Для таблицы `products`:
```sql
-- Включить RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Админы могут все
CREATE POLICY "Admins can do everything" ON products
  FOR ALL USING (auth.role() = 'admin');

-- Пользователи могут читать активные продукты
CREATE POLICY "Users can read active products" ON products
  FOR SELECT USING (
    in_stock = true AND 
    (specifications->>'status' IS NULL OR specifications->>'status' != 'inactive')
  );

-- API ключи могут читать все
CREATE POLICY "API can read all" ON products
  FOR SELECT USING (auth.role() = 'service_role');
```

### Для таблицы `categories`:
```sql
-- Включить RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Админы могут все
CREATE POLICY "Admins can do everything" ON categories
  FOR ALL USING (auth.role() = 'admin');

-- Пользователи могут читать активные категории
CREATE POLICY "Users can read active categories" ON categories
  FOR SELECT USING (is_active = true);

-- API ключи могут читать все
CREATE POLICY "API can read all" ON categories
  FOR SELECT USING (auth.role() = 'service_role');
```

### Для таблицы `subcategories`:
```sql
-- Включить RLS
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Админы могут все
CREATE POLICY "Admins can do everything" ON subcategories
  FOR ALL USING (auth.role() = 'admin');

-- Пользователи могут читать активные подкатегории
CREATE POLICY "Users can read active subcategories" ON subcategories
  FOR SELECT USING (is_active = true);

-- API ключи могут читать все
CREATE POLICY "API can read all" ON subcategories
  FOR SELECT USING (auth.role() = 'service_role');
```

### Для таблицы `suppliers`:
```sql
-- Включить RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Админы могут все
CREATE POLICY "Admins can do everything" ON suppliers
  FOR ALL USING (auth.role() = 'admin');

-- API ключи могут читать все
CREATE POLICY "API can read all" ON suppliers
  FOR SELECT USING (auth.role() = 'service_role');
```

## 🧪 Тестирование

### Тесты для выполнения:
- [ ] Админ может создавать/редактировать/удалять продукты
- [ ] Обычный пользователь может только читать активные продукты
- [ ] API может читать все данные
- [ ] Импорт работает через админку
- [ ] Каталог отображается корректно

### Команды для тестирования:
```sql
-- Проверить что RLS включен
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('products', 'categories', 'subcategories', 'suppliers');

-- Проверить policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('products', 'categories', 'subcategories', 'suppliers');
```

## ⚠️ Важные моменты

1. **Тестирование обязательно** - сначала на dev/staging
2. **Backup перед включением** - на случай отката
3. **Окно изменений** - выполнять в минимальной нагрузке
4. **Мониторинг** - следить за ошибками после включения
5. **Откат** - план отключения RLS если что-то пойдет не так

## 📅 Временные рамки

- **DEV/STAGING**: 1-2 дня на тестирование
- **PRODUCTION**: 30 минут окно изменений
- **Мониторинг**: 24 часа после включения

---

**Статус:** Планируется  
**Ответственный:** Команда разработки  
**Дата планируемого включения:** После успешного тестирования
