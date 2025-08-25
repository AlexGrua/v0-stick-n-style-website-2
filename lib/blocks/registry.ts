/* Registry maps block type to schema and component.
   We reuse existing Home UI components to preserve UI exactly. */
import { 
  HeroSchema, 
  FeaturesSchema, 
  ProductGridSchema,
  ContactFormBlockSchema,
  ContactsHeroSchema,
  ContactChannelsSchema
} from "./types"
import { HeroBlock } from "@/components/home/hero-block"
import { AdvantagesBlock } from "@/components/home/advantages-block"
import { ProductGalleryBlock } from "@/components/home/product-gallery-block"
import ContactFormBlock from "@/components/blocks/contact-form-block"
import ContactsHero from "@/components/blocks/contacts-hero"
import ContactChannels from "@/components/blocks/contact-channels"

export const BlockRegistry = {
  // Home blocks
  hero: { component: HeroBlock, schema: HeroSchema },
  features: { component: AdvantagesBlock, schema: FeaturesSchema },
  productGrid: { component: ProductGalleryBlock, schema: ProductGridSchema },
  
  // Contact blocks
  contactsHero: { component: ContactsHero, schema: ContactsHeroSchema },
  contactFormBlock: { component: ContactFormBlock, schema: ContactFormBlockSchema },
  contactChannels: { component: ContactChannels, schema: ContactChannelsSchema },
} as const

export type BlockType = keyof typeof BlockRegistry


