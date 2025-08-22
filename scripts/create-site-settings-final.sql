-- Create site_settings table for storing page configurations
CREATE TABLE IF NOT EXISTS public.site_settings (
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
    BEFORE UPDATE ON public.site_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data for all pages
INSERT INTO public.site_settings (key, data) VALUES 
('about', '{
    "title": "About Us",
    "seoTitle": "About Us - Stick''N''Style",
    "description": "Learn about our company and mission",
    "seoDescription": "Discover the story behind Stick''N''Style and our commitment to quality interior solutions",
    "heroTitle": "About Stick''N''Style",
    "companyStory": "Founded with a passion for innovative interior design, Stick''N''Style has been at the forefront of premium wall panel and flooring solutions.",
    "mission": "To provide high-quality, innovative interior solutions that transform spaces and exceed customer expectations."
}'),
('contact', '{
    "title": "Contact Us",
    "seoTitle": "Contact Us - Stick''N''Style",
    "description": "Get in touch with our team",
    "seoDescription": "Contact Stick''N''Style for inquiries about our premium interior solutions and services",
    "heroTitle": "Contact Us",
    "address": "123 Design Street, Interior City, IC 12345",
    "phone": "+1 (555) 123-4567",
    "email": "info@sticknstyle.com",
    "workingHours": "Monday - Friday: 9:00 AM - 6:00 PM"
}'),
('catalog', '{
    "title": "Catalog",
    "seoTitle": "Product Catalog - Stick''N''Style",
    "description": "Browse our complete collection of premium panels and flooring",
    "seoDescription": "Explore our extensive catalog of 3D wall panels, flooring solutions, and adhesive products",
    "heroTitle": "Premium Panels & Flooring Collection",
    "heroSubtitle": "Discover innovative solutions for modern interiors",
    "showFilters": true,
    "showSorting": true,
    "productsPerPage": 12,
    "layout": "grid"
}'),
('footer', '{
    "companyName": "Stick''N''Style",
    "description": "Premium interior solutions for modern spaces",
    "address": "123 Design Street, Interior City, IC 12345",
    "phone": "+1 (555) 123-4567",
    "email": "info@sticknstyle.com",
    "quickLinks": [
        {"name": "Home", "url": "/"},
        {"name": "Catalog", "url": "/catalog"},
        {"name": "About Us", "url": "/about"},
        {"name": "Contact", "url": "/contact"}
    ],
    "socialLinks": [
        {"name": "Facebook", "url": "#"},
        {"name": "Instagram", "url": "#"},
        {"name": "LinkedIn", "url": "#"}
    ],
    "copyright": "© 2024 Stick''N''Style. All rights reserved."
}'),
('navigation', '{
    "menuItems": [
        {"name": "Home", "url": "/", "order": 1, "visible": true},
        {"name": "Catalog", "url": "/catalog", "order": 2, "visible": true},
        {"name": "About Us", "url": "/about", "order": 3, "visible": true},
        {"name": "Contact", "url": "/contact", "order": 4, "visible": true}
    ],
    "showLogo": true,
    "showSearch": true,
    "showCart": true,
    "showLanguageSelector": true
}')
ON CONFLICT (key) DO NOTHING;
