-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  country VARCHAR(100),
  website VARCHAR(255),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);

-- Insert some sample data
INSERT INTO public.suppliers (name, contact_person, email, phone, country, status) VALUES
('Premium Materials Ltd', 'John Smith', 'john@premium.com', '+1-555-0123', 'USA', 'active'),
('European Panels Co', 'Maria Garcia', 'maria@europanels.com', '+34-123-456789', 'Spain', 'active'),
('Asian Flooring Inc', 'Li Wei', 'li@asianflooring.com', '+86-138-0013-8000', 'China', 'active')
ON CONFLICT DO NOTHING;
