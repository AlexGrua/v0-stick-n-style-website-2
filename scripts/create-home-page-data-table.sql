-- Create home_page_data table for storing homepage configuration
CREATE TABLE IF NOT EXISTS home_page_data (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default home page data
INSERT INTO home_page_data (id, data) VALUES (1, '{
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
        "id": "adv-1",
        "icon": "🏆",
        "title": "Премиальное качество",
        "description": "Только лучшие материалы от проверенных производителей"
      },
      {
        "id": "adv-2",
        "icon": "🚚",
        "title": "Быстрая доставка",
        "description": "Доставляем по всему миру в кратчайшие сроки"
      },
      {
        "id": "adv-3",
        "icon": "💡",
        "title": "Инновационные решения",
        "description": "Современные технологии для вашего интерьера"
      }
    ],
    "visible": true
  },
  "productGallery": {
    "title": "Популярные товары",
    "subtitle": "Наши бестселлеры",
    "products": [
      {
        "id": "prod-1",
        "name": "3D Панели",
        "image": "/stone-brick-wall-panels.png",
        "category": "wall-panel",
        "link": "/catalog/wall-panel"
      },
      {
        "id": "prod-2",
        "name": "Напольные покрытия",
        "image": "/wood-flooring-textures.png",
        "category": "flooring",
        "link": "/catalog/flooring"
      }
    ],
    "visible": true
  },
  "cooperation": {
    "title": "Сотрудничество",
    "subtitle": "Работаем с профессионалами",
    "description": "Специальные условия для дизайнеров, архитекторов и строительных компаний",
    "backgroundImage": "/fabric-texture-wall-panels.png",
    "ctaText": "Стать партнером",
    "ctaLink": "/partnership",
    "visible": true
  },
  "customBlocks": [],
  "blockOrder": ["hero", "advantages", "productGallery", "cooperation"]
}') ON CONFLICT (id) DO NOTHING;

-- Add RLS policies if needed
ALTER TABLE home_page_data ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY IF NOT EXISTS "Allow read access for authenticated users" ON home_page_data
  FOR SELECT USING (true);

-- Allow full access for service role
CREATE POLICY IF NOT EXISTS "Allow full access for service role" ON home_page_data
  FOR ALL USING (true);
