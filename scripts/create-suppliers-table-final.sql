-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  contact_person VARCHAR(255),
  categories JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO public.suppliers (name, email, phone, address, contact_person, categories, notes, status) VALUES
('ООО "СтройМатериалы"', 'info@stroymaterials.ru', '+7 (495) 123-45-67', 'г. Москва, ул. Строительная, д. 15', 'Иванов Иван Иванович', '[1, 2]', 'Основной поставщик строительных материалов', 'active'),
('ТД "Декор Плюс"', 'sales@decorplus.ru', '+7 (812) 987-65-43', 'г. Санкт-Петербург, пр. Невский, д. 100', 'Петрова Анна Сергеевна', '[1]', 'Специализируется на декоративных панелях', 'active'),
('Компания "ПолПро"', 'order@polpro.ru', '+7 (495) 555-12-34', 'г. Москва, ул. Промышленная, д. 8', 'Сидоров Петр Александрович', '[2]', 'Поставщик напольных покрытий', 'active');
