-- Create site_settings table for storing page configurations
CREATE TABLE IF NOT EXISTS public.site_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to automatically update updated_at
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

-- Insert initial data for pages
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
    "seoDescription": "Contact Stick''N''Style for inquiries about our products and services",
    "heroTitle": "Contact Us",
    "address": "123 Design Street, Interior City, IC 12345",
    "phone": "+1 (555) 123-4567",
    "email": "info@sticknstyle.com",
    "hours": "Monday - Friday: 9:00 AM - 6:00 PM"
}'),
('catalog', '{
    "title": "Catalog",
    "seoTitle": "Product Catalog - Stick''N''Style",
    "description": "Browse our complete collection of premium panels and flooring",
    "seoDescription": "Explore our extensive catalog of 3D wall panels, flooring solutions, and adhesive products",
    "heroTitle": "Premium Panels & Flooring Collection",
    "heroSubtitle": "Discover innovative solutions for modern interiors"
}'),
('footer', '{
    "companyName": "Stick''N''Style",
    "description": "Premium interior solutions for modern spaces",
    "address": "123 Design Street, Interior City, IC 12345",
    "phone": "+1 (555) 123-4567",
    "email": "info@sticknstyle.com",
    "socialLinks": {
        "facebook": "#",
        "instagram": "#",
        "linkedin": "#"
    },
    "quickLinks": [
        {"name": "About Us", "url": "/about"},
        {"name": "Products", "url": "/catalog"},
        {"name": "Contact", "url": "/contact"}
    ],
    "copyright": "© 2024 Stick''N''Style. All rights reserved."
}')
ON CONFLICT (key) DO NOTHING;
