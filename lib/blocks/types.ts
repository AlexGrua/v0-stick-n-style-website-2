import { z } from "zod"

export const HeroSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional().default(""),
  imageId: z.string().optional(),
  ctas: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  sliderImageIds: z.array(z.string()).default([]),
})

export const FeaturesSchema = z.object({
  items: z
    .array(
      z.object({
        icon: z.string().optional(),
        title: z.string().min(1),
        text: z.string().optional(),
      }),
    )
    .min(1),
})

export const ProductGridSchema = z.object({
  source: z.enum(["byCategories", "new", "manual"]).default("byCategories"),
  categorySlugs: z.array(z.string()).default([]),
  skus: z.array(z.string()).default([]),
  limit: z.number().int().min(1).max(48).default(12),
  sort: z.enum(["newest", "priceAsc", "priceDesc", "popular"]).default("newest"),
})

// About Us schemas
export const AboutHeroSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional().default(""),
  imageId: z.string().optional(),
  ctas: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
})

export const RichTextSchema = z.object({
  html: z.string().default(""), // sanitize server-side
})

export const TeamGridSchema = z.object({
  items: z.array(z.object({
    name: z.string().min(1),
    role: z.string().optional().default(""),
    photoId: z.string().optional(),
    links: z.array(z.object({ label: z.string(), href: z.string().url() })).default([]),
  })).default([]),
})

export const StatsSchema = z.object({
  items: z.array(z.object({
    label: z.string().min(1),
    value: z.string().min(1),
  })).default([]),
})

export const GallerySchema = z.object({
  imageIds: z.array(z.string()).default([]),
})

// Contact schemas
export const ContactsHeroSchema = z.object({
  title: z.string().min(1).default('Contact Us'),
  subtitle: z.string().default('Tell us about your project or request a quote.'),
});

export const ContactChannelItemSchema = z.object({
  iconKey: z.string().optional(),   // свободная строка: 'email','whatsapp','wechat','instagram', и т.д.
  iconId: z.string().optional(),    // кастомная иконка из медиатеки
  label: z.string().min(1),         // произвольный текст ('WhatsApp','WeChat','Instagram'...)
  value: z.string().min(1),         // любой текст/номер/e-mail
  href: z.string().optional(),      // НЕ url(); можно 'mailto:..','tel:..','https://..' и т.п.
  visible: z.boolean().default(true),
})

export const ContactChannelsSchema = z.object({
  items: z.array(ContactChannelItemSchema).min(1),
});

// Contacts schemas (legacy)
export const ContactInfoSchema = z.object({
  offices: z.array(z.object({
    title: z.string().min(1),
    address: z.string().min(1),
    phones: z.array(z.string()).default([]),
    emails: z.array(z.string().email()).default([]),
    hours: z.string().optional().default(""),
    messengers: z.array(z.object({ label: z.string(), href: z.string().url() })).default([]),
  })).default([]),
})

export const MapSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  zoom: z.number().optional().default(12),
  embedUrl: z.string().url().optional(),
}).refine(v => (v.embedUrl || (v.lat && v.lng)), { message: "Provide embedUrl or lat/lng" })

export const ContactFormBlockSchema = z.object({
  title: z.string().optional().default(''),
  subtitle: z.string().optional().default(''),
  description: z.string().optional().default(''),
})

export type HeroData = z.infer<typeof HeroSchema>
export type FeaturesData = z.infer<typeof FeaturesSchema>
export type ProductGridData = z.infer<typeof ProductGridSchema>

// About types
export type AboutHeroData = z.infer<typeof AboutHeroSchema>
export type RichTextData = z.infer<typeof RichTextSchema>
export type TeamGridData = z.infer<typeof TeamGridSchema>
export type StatsData = z.infer<typeof StatsSchema>
export type GalleryData = z.infer<typeof GallerySchema>

// Contact types
export type ContactsHeroData = z.infer<typeof ContactsHeroSchema>
export type ContactChannelItemData = z.infer<typeof ContactChannelItemSchema>
export type ContactChannelsData = z.infer<typeof ContactChannelsSchema>

// Contacts types (legacy)
export type ContactInfoData = z.infer<typeof ContactInfoSchema>
export type MapData = z.infer<typeof MapSchema>
export type ContactFormBlockData = z.infer<typeof ContactFormBlockSchema>


