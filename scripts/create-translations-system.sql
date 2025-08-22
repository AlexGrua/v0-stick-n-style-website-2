-- Fixed SQL syntax error in INSERT statement
-- Создание полной системы переводов для всего контента
-- Таблицы для переводов продуктов
CREATE TABLE IF NOT EXISTS product_translations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, language_code)
);

-- Таблицы для переводов категорий
CREATE TABLE IF NOT EXISTS category_translations (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, language_code)
);

-- Таблицы для переводов страниц и блоков
CREATE TABLE IF NOT EXISTS page_translations (
  id SERIAL PRIMARY KEY,
  page_key VARCHAR(100) NOT NULL, -- 'home_hero', 'home_advantages', 'about_page', etc.
  language_code VARCHAR(5) NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(page_key, language_code)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_product_translations_product_id ON product_translations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_translations_language ON product_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_category_translations_category_id ON category_translations(category_id);
CREATE INDEX IF NOT EXISTS idx_category_translations_language ON category_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_page_translations_page_key ON page_translations(page_key);
CREATE INDEX IF NOT EXISTS idx_page_translations_language ON page_translations(language_code);

-- RLS политики для безопасности
ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_translations ENABLE ROW LEVEL SECURITY;

-- Политики для чтения (все могут читать)
CREATE POLICY "Allow read access to product translations" ON product_translations FOR SELECT USING (true);
CREATE POLICY "Allow read access to category translations" ON category_translations FOR SELECT USING (true);
CREATE POLICY "Allow read access to page translations" ON page_translations FOR SELECT USING (true);

-- Политики для записи (только аутентифицированные пользователи)
CREATE POLICY "Allow authenticated users to manage product translations" ON product_translations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage category translations" ON category_translations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to manage page translations" ON page_translations FOR ALL USING (auth.role() = 'authenticated');

-- Заполнение английскими данными как базовые переводы
INSERT INTO product_translations (product_id, language_code, name, description, specifications)
SELECT id, 'en', name, description, specifications 
FROM products 
ON CONFLICT (product_id, language_code) DO NOTHING;

INSERT INTO category_translations (category_id, language_code, name, description)
SELECT id, 'en', name, description 
FROM categories 
ON CONFLICT (category_id, language_code) DO NOTHING;

-- Fixed INSERT syntax by removing SELECT before VALUES
-- Заполнение переводов для главной страницы
INSERT INTO page_translations (page_key, language_code, content)
VALUES ('home_page', 'en', '{}')
ON CONFLICT (page_key, language_code) DO NOTHING;
