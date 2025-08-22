-- Create site_settings table for Pages Management
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_settings_updated_at 
    BEFORE UPDATE ON site_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data for all pages
INSERT INTO site_settings (key, data) VALUES 
('home_page', '{
  "title": "Home",
  "seoTitle": "Stick''N''Style - Premium Wall Panels & Flooring",
  "description": "Transform your space with our innovative interior solutions",
  "seoDescription": "Discover premium 3D wall panels, luxury flooring, and innovative interior design solutions at Stick''N''Style"
}'),
('catalog_page', '{
  "title": "Catalog",
  "seoTitle": "Product Catalog - Stick''N''Style",
  "description": "Browse our complete collection of premium panels and flooring",
  "seoDescription": "Explore our extensive catalog of 3D wall panels, flooring solutions, and adhesive products",
  "heroTitle": "Premium Panels & Flooring Collection",
  "heroSubtitle": "Discover innovative solutions for modern interiors",
  "showFilters": true,
  "showSorting": true,
  "productsPerPage": 12
}'),
('about_page', '{
  "title": "About Us",
  "seoTitle": "About Us - Stick''N''Style",
  "description": "Learn about our passion for innovative interior design",
  "seoDescription": "Founded with a passion for innovative interior design, Stick''N''Style has been at the forefront of premium wall panel and flooring solutions",
  "heroTitle": "About Stick''N''Style",
  "companyStory": "Founded with a passion for innovative interior design, Stick''N''Style has been at the forefront of premium wall panel and flooring solutions.",
  "mission": "To provide high-quality, innovative interior solutions that transform spaces and exceed customer expectations."
}'),
('contact_page', '{
  "title": "Contact Us",
  "seoTitle": "Contact Us - Stick''N''Style",
  "description": "Get in touch with our team for expert advice",
  "seoDescription": "Contact Stick''N''Style for expert advice on wall panels, flooring solutions, and interior design projects",
  "heroTitle": "Get In Touch",
  "heroSubtitle": "Our team is here to help with your interior design projects",
  "showContactForm": true,
  "showMap": true,
  "showOfficeHours": true
}'),
('footer', '{
  "companyName": "Stick''N''Style",
  "description": "Premium wall panels and flooring solutions for modern interiors",
  "contactInfo": {
    "phone": "+1 (555) 123-4567",
    "email": "info@sticknstyle.com",
    "address": "123 Design Street, Interior City, IC 12345"
  },
  "quickLinks": [
    {"label": "Home", "url": "/"},
    {"label": "Catalog", "url": "/catalog"},
    {"label": "About Us", "url": "/about"},
    {"label": "Contact", "url": "/contact"}
  ],
  "socialLinks": [
    {"platform": "Facebook", "url": "https://facebook.com/sticknstyle"},
    {"platform": "Instagram", "url": "https://instagram.com/sticknstyle"},
    {"platform": "LinkedIn", "url": "https://linkedin.com/company/sticknstyle"}
  ],
  "copyright": "© 2024 Stick''N''Style. All rights reserved."
}'),
('navigation', '{
  "mainMenu": [
    {"label": "Home", "url": "/", "order": 1, "visible": true},
    {"label": "Catalog", "url": "/catalog", "order": 2, "visible": true},
    {"label": "About Us", "url": "/about", "order": 3, "visible": true},
    {"label": "Contact", "url": "/contact", "order": 4, "visible": true}
  ],
  "showSearch": true,
  "showLanguageSelector": true,
  "showUserAccount": true
}')
ON CONFLICT (key) DO NOTHING;
