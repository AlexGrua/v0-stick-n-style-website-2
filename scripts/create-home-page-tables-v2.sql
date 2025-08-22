-- Create tables for home page data storage
CREATE TABLE IF NOT EXISTS public.home_page_data (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  category_id INTEGER REFERENCES public.categories(id),
  image_url TEXT,
  images JSONB DEFAULT '[]',
  specifications JSONB DEFAULT '{}',
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial home page data
INSERT INTO public.home_page_data (data) VALUES (
  '{
    "hero": {
      "title": "Stick''N''Style",
      "subtitle": "Премиальные отделочные материалы",
      "description": "Создайте уникальный интерьер с нашими инновационными решениями для стен и полов",
      "backgroundImage": "/modern-interior-3d-panels.png",
      "ctaText": "Смотреть каталог",
      "ctaLink": "/catalog",
      "visible": true
    },
    "advantages": {
      "title": "Наши преимущества",
      "subtitle": "Почему выбирают нас",
      "advantages": [
        {
          "id": "1",
          "icon": "🏆",
          "title": "Премиальное качество",
          "description": "Только лучшие материалы от проверенных производителей"
        },
        {
          "id": "2", 
          "icon": "🚚",
          "title": "Быстрая доставка",
          "description": "Доставим ваш заказ в кратчайшие сроки"
        },
        {
          "id": "3",
          "icon": "💡",
          "title": "Инновационные решения",
          "description": "Современные технологии для вашего интерьера"
        }
      ],
      "visible": true
    },
    "productGallery": {
      "title": "Наша продукция",
      "subtitle": "Широкий ассортимент отделочных материалов",
      "categories": [
        {
          "id": "1",
          "name": "3D панели",
          "image": "/stone-brick-wall-panels.png",
          "link": "/catalog/3d-panels"
        },
        {
          "id": "2",
          "name": "Напольные покрытия",
          "image": "/wood-flooring-textures.png", 
          "link": "/catalog/flooring"
        },
        {
          "id": "3",
          "name": "Декоративные элементы",
          "image": "/fabric-texture-wall-panels.png",
          "link": "/catalog/decorative"
        }
      ],
      "visible": true
    },
    "cooperation": {
      "title": "Сотрудничество",
      "subtitle": "Работаем с дизайнерами и строительными компаниями",
      "description": "Предлагаем выгодные условия для профессионалов",
      "features": [
        "Специальные цены для партнеров",
        "Техническая поддержка проектов",
        "Индивидуальный подход к каждому клиенту"
      ],
      "ctaText": "Стать партнером",
      "ctaLink": "/partnership",
      "image": "/diverse-products-still-life.png",
      "visible": true
    },
    "customBlocks": [],
    "blockOrder": ["hero", "advantages", "productGallery", "cooperation"]
  }'
) ON CONFLICT DO NOTHING;

-- Insert sample categories
INSERT INTO public.categories (name, slug, description, image_url) VALUES
  ('3D панели', '3d-panels', 'Декоративные 3D панели для стен', '/stone-brick-wall-panels.png'),
  ('Напольные покрытия', 'flooring', 'Современные напольные покрытия', '/wood-flooring-textures.png'),
  ('Декоративные элементы', 'decorative', 'Декоративные элементы интерьера', '/fabric-texture-wall-panels.png')
ON CONFLICT (slug) DO NOTHING;
