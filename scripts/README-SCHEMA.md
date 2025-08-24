# 🎯 Единая схема базы данных

## 📋 Обзор

Этот документ описывает **единую эталонную схему** базы данных для системы управления продуктами.

## 🏗️ Структура

### Основные таблицы:
- `suppliers` - поставщики
- `categories` - категории
- `subcategories` - подкатегории  
- `products` - продукты

### Ключевые принципы:
1. **Все ID - INTEGER (SERIAL PRIMARY KEY)**
2. **Все связи через FOREIGN KEY**
3. **Дополнительные данные в specifications JSONB**
4. **Единообразные имена: category_id, subcategory_id, supplier_id**

## 📊 Схема таблиц

### suppliers
```sql
id SERIAL PRIMARY KEY
code VARCHAR(10) UNIQUE NOT NULL
name TEXT NOT NULL
contact_person TEXT
email TEXT
phone TEXT
address TEXT
status TEXT DEFAULT 'active'
created_at TIMESTAMP WITH TIME ZONE
updated_at TIMESTAMP WITH TIME ZONE
```

### categories
```sql
id SERIAL PRIMARY KEY
name TEXT NOT NULL
slug TEXT UNIQUE NOT NULL
description TEXT
image_url TEXT
sort_order INTEGER DEFAULT 0
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP WITH TIME ZONE
updated_at TIMESTAMP WITH TIME ZONE
```

### subcategories
```sql
id SERIAL PRIMARY KEY
category_id INTEGER NOT NULL REFERENCES categories(id)
name TEXT NOT NULL
slug TEXT NOT NULL
description TEXT
image_url TEXT
sort_order INTEGER DEFAULT 0
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP WITH TIME ZONE
updated_at TIMESTAMP WITH TIME ZONE
UNIQUE(category_id, slug)
```

### products
```sql
id SERIAL PRIMARY KEY
sku TEXT UNIQUE NOT NULL
name TEXT NOT NULL
description TEXT
category_id INTEGER NOT NULL REFERENCES categories(id)
subcategory_id INTEGER REFERENCES subcategories(id)
supplier_id INTEGER REFERENCES suppliers(id)
image_url TEXT
price DECIMAL(10,2)
in_stock BOOLEAN DEFAULT true
is_featured BOOLEAN DEFAULT false
slug TEXT UNIQUE
specifications JSONB DEFAULT '{}'::jsonb
created_at TIMESTAMP WITH TIME ZONE
updated_at TIMESTAMP WITH TIME ZONE
```

## 📝 Структура specifications JSONB

```json
{
  "sku": "PRODUCT-SKU",
  "status": "active|inactive|discontinued",
  "technicalSpecifications": [
    {
      "size": "60x60cm",
      "thicknesses": [
        {
          "thickness": "2mm",
          "pcsPerBox": 50,
          "boxSize": "60x60x2cm",
          "boxVolume": 0.0072,
          "boxWeight": 2.5,
          "priceModifier": 0
        }
      ]
    }
  ],
  "colorVariants": [
    {
      "name": "White",
      "colorCode": "WHITE",
      "image": "/white-panel.jpg",
      "priceModifier": 0
    }
  ],
  "productSpecifications": {
    "material": [
      {"description": "High-quality PVC", "icon": ""}
    ],
    "usage": [
      {"description": "Interior wall decoration", "icon": ""}
    ],
    "application": [
      {"description": "Living rooms, offices", "icon": ""}
    ],
    "physicalProperties": [
      {"description": "Fire resistant", "icon": ""}
    ],
    "adhesion": [
      {"description": "Strong adhesive backing", "icon": ""}
    ]
  },
  "interiorApplications": [
    {
      "name": "Living Room",
      "description": "Perfect for modern living rooms",
      "image": "/living-room.jpg"
    }
  ],
  "installationNotes": "Clean surface before installation",
  "otherPhotos": ["/photo1.jpg", "/photo2.jpg"]
}
```

## 🔄 API Endpoints

### Products
- `GET /api/products` - список продуктов
- `POST /api/products` - создание продукта
- `GET /api/products/[id]` - получение продукта
- `PUT /api/products/[id]` - обновление продукта
- `DELETE /api/products/[id]` - удаление продукта

### Import/Export
- `GET /api/products/template` - скачать шаблон Excel
- `POST /api/products/import` - импорт из Excel
- `GET /api/products/import/reference` - справочные данные

### Categories
- `GET /api/categories` - список категорий
- `POST /api/categories` - создание категории
- `GET /api/categories/[id]` - получение категории
- `PUT /api/categories/[id]` - обновление категории

### Suppliers
- `GET /api/suppliers` - список поставщиков
- `POST /api/suppliers` - создание поставщика
- `GET /api/suppliers/[id]` - получение поставщика
- `PUT /api/suppliers/[id]` - обновление поставщика

## 📋 Правила именования

### База данных
- Все таблицы в единственном числе: `product`, `category`, `supplier`
- Все поля в snake_case: `category_id`, `subcategory_id`, `supplier_id`
- JSONB поля: `specifications`, `metadata`

### API
- Endpoints в множественном числе: `/api/products`, `/api/categories`
- Request/Response в camelCase: `categoryId`, `subcategoryId`, `supplierId`

### Frontend
- TypeScript типы в PascalCase: `Product`, `Category`, `Supplier`
- Props в camelCase: `categoryId`, `subcategoryId`, `supplierId`

## 🚀 Миграция

### Для разработчиков:
1. Выполнить `scripts/create-unified-schema.sql`
2. Обновить все API endpoints
3. Обновить все компоненты фронтенда
4. Протестировать импорт/экспорт

### Для продакшена:
1. Создать backup текущей базы
2. Выполнить миграцию данных
3. Обновить код
4. Протестировать функциональность

## ⚠️ Важные замечания

1. **НЕ ИЗМЕНЯТЬ** структуру без обсуждения с командой
2. **ВСЕГДА** использовать единую схему для новых функций
3. **ДОКУМЕНТИРОВАТЬ** все изменения в схеме
4. **ТЕСТИРОВАТЬ** импорт/экспорт после изменений

## 📞 Поддержка

При возникновении вопросов по схеме обращайтесь к команде разработки.
