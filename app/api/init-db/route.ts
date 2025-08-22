import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createClient()

    const { error: createError } = await supabase.rpc("create_site_settings_table")

    if (createError) {
      // If RPC doesn't exist, create table directly
      const { error: tableError } = await supabase.from("site_settings").select("key").limit(1)

      if (tableError && tableError.message.includes("does not exist")) {
        // Create table using raw SQL
        const { error: sqlError } = await supabase.rpc("exec_sql", {
          sql: `
            CREATE TABLE IF NOT EXISTS site_settings (
              id SERIAL PRIMARY KEY,
              key VARCHAR(255) UNIQUE NOT NULL,
              data JSONB NOT NULL DEFAULT '{}',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
            END;
            $$ language 'plpgsql';
            
            CREATE TRIGGER update_site_settings_updated_at 
              BEFORE UPDATE ON site_settings 
              FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
            INSERT INTO site_settings (key, data) VALUES
            ('about', '{"title": "About Us", "seoTitle": "About Us - Stick''N''Style", "heroTitle": "About Stick''N''Style", "companyStory": "Founded with a passion for innovative interior design, Stick''N''Style has been at the forefront of premium wall panel and flooring solutions.", "mission": "To provide high-quality, innovative interior solutions that transform spaces and exceed customer expectations."}'),
            ('contact', '{"title": "Contact Us", "seoTitle": "Contact Us - Stick''N''Style", "heroTitle": "Get in Touch", "description": "We''d love to hear from you. Send us a message and we''ll respond as soon as possible.", "address": "123 Design Street, Interior City, IC 12345", "phone": "+1 (555) 123-4567", "email": "info@sticknstyle.com"}'),
            ('catalog', '{"title": "Catalog", "seoTitle": "Product Catalog - Stick''N''Style", "heroTitle": "Premium Panels & Flooring Collection", "heroSubtitle": "Discover innovative solutions for modern interiors", "description": "Browse our complete collection of premium panels and flooring"}'),
            ('footer', '{"companyInfo": {"name": "Stick''N''Style", "description": "Premium interior solutions for modern spaces"}, "contact": {"address": "123 Design Street, Interior City, IC 12345", "phone": "+1 (555) 123-4567", "email": "info@sticknstyle.com"}, "quickLinks": [{"name": "Home", "url": "/"}, {"name": "Catalog", "url": "/catalog"}, {"name": "About", "url": "/about"}, {"name": "Contact", "url": "/contact"}], "socialLinks": [{"name": "Facebook", "url": "#"}, {"name": "Instagram", "url": "#"}, {"name": "LinkedIn", "url": "#"}], "copyright": "© 2024 Stick''N''Style. All rights reserved."}'),
            ('navigation', '{"menuItems": [{"name": "Home", "url": "/", "order": 1, "visible": true}, {"name": "Catalog", "url": "/catalog", "order": 2, "visible": true}, {"name": "About", "url": "/about", "order": 3, "visible": true}, {"name": "Contact", "url": "/contact", "order": 4, "visible": true}]}')
            ON CONFLICT (key) DO NOTHING;
          `,
        })

        if (sqlError) {
          console.error("Error creating table:", sqlError)
          return NextResponse.json({ error: "Failed to create table" }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true, message: "Database initialized successfully" })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json({ error: "Database initialization failed" }, { status: 500 })
  }
}
